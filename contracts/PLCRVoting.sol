pragma solidity ^0.4.8;
import "./HumanStandardToken.sol";

/**
@title Partial-Lock-Commit-Reveal Voting scheme with ERC20 tokens 
@author Team: Aspyn Palatnick, Cem Ozer, Yorke Rhodes
*/
contract PLCRVoting {
    /// maps user's address to voteToken balance
    mapping(address => uint) public voteTokenBalance;

    struct Poll {
        string proposal;        /// proposal to be voted for/against
        uint commitEndDate;     /// expiration date of commit period for poll
        uint revealEndDate;     /// expiration date of reveal period for poll
        uint voteQuorum;	    /// number of votes required for a proposal to pass
        uint votesFor;		    /// tally of votes supporting proposal
        uint votesAgainst;      /// tally of votes countering proposal
    }
    
    /// maps pollID to Poll struct
    mapping(uint => Poll) public pollMap;
    uint pollNonce;
    event PollCreated(uint pollID);

    // represent a double linked list through mapping
    // sha3(userAddress, pollID, "prevID") => byte32 prevID
    // sha3(userAddress, pollID, "nextID") => byte32 nextID
    // sha3(userAddress, pollID, "numTokens") => byte32 numTokens
    // sha3(userAddress, pollID, "commitHash") => byte32 commitHash
    mapping(bytes32 => uint) public voteMap;    
       
    uint constant VOTE_OPTION_FOR = 1; /// vote option indicating a vote for the proposal

    // ============
    // CONSTRUCTOR:
    // ============

    uint constant INITIAL_POLL_NONCE = 0;
    address owner;
    HumanStandardToken public token;

    /**
    @dev Initializes voteQuorum, commitDuration, revealDuration, and pollNonce in addition to token contract and trusted mapping
    @param tokenAddr The address where the ERC20 token contract is deployed
    */
    function PLCRVoting(address tokenAddr) {
        token = HumanStandardToken(tokenAddr);
        owner = msg.sender;
        pollNonce = INITIAL_POLL_NONCE;
    }

    // ================
    // TOKEN INTERFACE:
    // ================

    /**    
    @notice Loads numTokens ERC20 tokens into the voting contract for one-to-one voting rights
    @dev Assumes that msg.sender has approved voting contract to spend on their behalf
    @param numTokens The number of votingTokens desired in exchange for ERC20 tokens
    */
    function requestVotingRights(uint numTokens) external {
        require(token.balanceOf(msg.sender) >= numTokens);
        require(token.transferFrom(msg.sender, this, numTokens));
        voteTokenBalance[msg.sender] += numTokens;
    }

    /**
    @notice Withdraw numTokens ERC20 tokens from the voting contract, revoking these voting rights
    @param numTokens The number of ERC20 tokens desired in exchange for voting rights
    */
    function withdrawVotingRights(uint numTokens) external {
        uint availableTokens = voteTokenBalance[msg.sender] - getMaxTokens();
        require(availableTokens >= numTokens);
        require(token.transfer(msg.sender, numTokens));
        voteTokenBalance[msg.sender] -= numTokens;
    }

    // =================
    // VOTING INTERFACE:
    // =================

    /**
    @notice Commits vote using hash of choice and secret salt to conceal vote until reveal
    @param pollID Integer identifier associated with target poll
    @param hashOfVoteAndSalt Commit hash of voter's secret choice and salt (randomly chosen number needed to reveal)
    @param numTokens The number of tokens to be committed towards the target poll
    @param prevPollID The ID of the poll that the user has voted the maximum number of tokens in which is still less than or equal to numTokens 
    */
    function commitVote(uint pollID, bytes32 hashOfVoteAndSalt, uint numTokens, uint prevPollID) external returns (bool successful) {
        // Make sure the user has enough tokens to commit
        require(hasEnoughTokens(numTokens));

        // Make sure the commit period is active
        require(commitPeriodActive(pollID));

        // Make sure user is not trying to manually commit
        // a vote corresponding the zero node
        require(pollID != 0);

        uint prevPollID2 = prevPollID;
        // Check to see if we are making an update
        // as opposed to an insert
        bool isUpdatingExistingNode = false;
        if (pollID == prevPollID) {
            // Check to see if the commit hash was not previously set,
            // which would imply that no commit to this 
            // poll was previously made
            if (getCommitHash(pollID) == 0) {
                return false;
            }
            
            // Making an update --> the previous node
            // has already been set, and so that
            // node can be used for validation
            prevPollID2 = getPreviousID(pollID);

            isUpdatingExistingNode = true;
        } else if (getCommitHash(pollID) != 0) {
            isUpdatingExistingNode = true;
        } 

        // Determine if the new node can be inserted/updated
        // at the given spot (i.e. the node right after prevPollID)
        bool isValid = validateNode(prevPollID2,pollID, numTokens);

        // Node is valid
        if (isValid) {
            // Update a previous commit
            if (isUpdatingExistingNode) {
                // Delete the current node as we will be re-inserting
                // that node with new attributes 
                deleteFromDll(pollID);
            }
            // Insert the <node at poll ID> after
            // the node at <prevPollID>:
            insertToDll(pollID, prevPollID2, numTokens, hashOfVoteAndSalt);
        }
        // Invalid prevPollID
        return false;
    }

    /**
    @notice Reveals vote with choice and secret salt used in generating commitHash to attribute committed tokens
    @param pollID Integer identifier associated with target poll
    @param salt Secret number used to generate commitHash for associated poll
    @param voteOption Vote choice used to generate commitHash for associated poll
    */
    function revealVote(uint pollID, uint salt, uint voteOption) external returns (bool successful) {
        
        // Make sure the reveal period is active
        require(revealPeriodActive(pollID));

        // Make sure the vote has not yet been revealed
        require(!hasBeenRevealed(pollID));

        bytes32 currHash = sha3(voteOption, salt);

        // Check if the hash from the input is the 
        // same as the commit hash
        if (currHash == getCommitHash(pollID)) {
            // Record the vote
            uint numTokens = getNumTokens(pollID);
            if (voteOption == VOTE_OPTION_FOR) {
                pollMap[pollID].votesFor += numTokens;
            } else {
                pollMap[pollID].votesAgainst += numTokens;
            }
            
            // Remove the node referring to this vote as we no longer need it
            deleteFromDll(pollID);
            return true;
        }
        return false;
    }

    function getNumPassingTokens(address user, uint pollID, uint salt) constant public returns (uint correctVotes) {
        require(pollEnded(pollID));
        uint winnerVote = isPassed(pollID) ? 1 : 0; 
        bytes32 winnerHash = sha3(winnerVote, salt);
        bytes32 commitHash = bytes32(voteMap[sha3(user, pollID, 'commitHash')]);

        if (commitHash == winnerHash) {
            uint numTokens = voteMap[sha3(user, pollID, 'numTokens')];
            return numTokens;
        } else {
            return 0;
        }
    }

    // ==================
    // POLLING INTERFACE:
    // ================== 

    /**
    @dev Initiates a poll with canonical configured parameters at pollID emitted by PollCreated event
    @param _proposal String representing poll subject matter to be voted for or against
    @param _voteQuorum Type of majority (out of 100) that is necessary for poll to be successful
    @param _commitDuration Length of desired commit period in seconds
    @param _revealDuration Length of desired reveal period in seconds
    */
    function startPoll(string _proposal, uint _voteQuorum, uint _commitDuration, uint _revealDuration) public returns (uint pollID) {
        require(isOwner(msg.sender));
        pollNonce = pollNonce + 1;

        pollMap[pollNonce] = Poll({
            proposal: _proposal,
            voteQuorum: _voteQuorum,
            commitEndDate: block.timestamp + _commitDuration,
            revealEndDate: block.timestamp + _commitDuration + _revealDuration,
            votesFor: 0,
            votesAgainst: 0
        });

        PollCreated(pollNonce);
        return pollNonce;
    }
 
    /**
    @notice Determines if proposal has passed
    @dev Check if votesFor out of totalVotes exceeds votesQuorum (requires pollEnded)
    @param pollID Integer identifier associated with target poll
    */
    function isPassed(uint pollID) constant public returns (bool passed) {
        require(pollEnded(pollID));

        Poll poll = pollMap[pollID];
        return ((100 - poll.voteQuorum) * poll.votesFor) >= (poll.voteQuorum * poll.votesAgainst);
    }

    // ----------------
    // POLLING HELPERS:
    // ----------------

    /**
    @dev Gets the total winning votes for reward distribution purposes
    @param pollID Integer identifier associated with target poll
    @return Total number of votes committed to the winning option for specified poll
    */
    function getTotalNumberOfTokensForWinningOption(uint pollID) constant public returns (uint numTokens) {
        require(pollEnded(pollID));

        if (isPassed(pollID)) {
            return pollMap[pollID].votesFor;
        } else {
            return pollMap[pollID].votesAgainst;
        }
    }

    /**
    @notice Determines if poll is over
    @dev Checks isExpired for specified poll's revealEndDate
    @return Boolean indication of whether polling period is over
    */
    function pollEnded(uint pollID) constant public returns (bool ended) {
        return isExpired(pollMap[pollID].revealEndDate);
    }

    /**
    @notice Checks if the commit period is still active for the specified poll
    @dev Checks isExpired for the specified poll's commitEndDate
    @param pollID Integer identifier associated with target poll
    @return Boolean indication of isCommitPeriodActive for target poll
    */
    function commitPeriodActive(uint pollID) constant public returns (bool active) {
        return !isExpired(pollMap[pollID].commitEndDate);
    }

    /**
    @notice Checks if the reveal period is still active for the specified poll
    @dev Checks isExpired for the specified poll's revealEndDate
    @param pollID Integer identifier associated with target poll
    */
    function revealPeriodActive(uint pollID) constant public returns (bool active) {
         return !isExpired(pollMap[pollID].revealEndDate) && !commitPeriodActive(pollID);
    }

    /**
    @dev Checks if user has already revealed for specified poll
    @param pollID Integer identifier associated with target poll
    @return Boolean indication of whether user has already revealed
    */
    function hasBeenRevealed(uint pollID) constant public returns (bool revealed) {
        uint prevID = getPreviousID(pollID);
        return prevID == getNextID(pollID) && prevID == pollID;
    }

    // ---------------------------
    // DOUBLE-LINKED-LIST HELPERS:
    // ---------------------------

    /**
    @dev Gets any integer property of target poll (not commitHash)
    @param pollID Integer identifier associated with target poll
    @param attrName Property key to be used in hash used to access poll-linked-list
    @return Integer property specified by attrName attached to target poll 
    */
    function getAttribute(uint pollID, string attrName) constant public returns (uint attribute) {    
        return voteMap[sha3(msg.sender, pollID, attrName)]; 
    }

    /**
    @dev Gets the bytes32 commitHash property of target poll
    @param pollID Integer identifier associated with target poll
    @return Bytes32 hash property attached to target poll 
    */
    function getCommitHash(uint pollID) constant public returns (bytes32 commitHash) { 
        return bytes32(voteMap[sha3(msg.sender, pollID, 'commitHash')]);    
    }

    /**
    @dev Sets any property of target poll
    @param pollID Integer assoacited with target poll
    @param attrName Property key to be used in hash used to access poll-linked-list
    @param attrVal Property value to store at generated hash
    */
    function setAttribute(uint pollID, string attrName, uint attrVal) internal { 
        voteMap[sha3(msg.sender, pollID, attrName)] = attrVal;  
    }

    /**
    @dev Inserts to sorted poll-linked-list (assumes supplied prevID is valid)
    @param pollID Integer identifier associated with target poll
    @param prevID Integer pointer to previous poll in sorted poll-linked-list
    @param numTokens Number of tokens to be committed to target poll
    */
    function insertToDll(uint pollID, uint prevID, uint numTokens, bytes32 commitHash) internal {
        uint nextID = getAttribute(prevID, "nextID");

        // make nextNode.prev point to newNode
        setAttribute(nextID, "prevID", pollID);

        // make prevNode.next point to newNode
        setAttribute(prevID, "nextID", pollID);

        // make newNode point to next and prev 
        setAttribute(pollID, "prevID", prevID); 
        setAttribute(pollID, "nextID", nextID); 

        // set properties of newNode
        setAttribute(pollID, "numTokens", numTokens);
        setAttribute(pollID, "commitHash", uint(commitHash));
    }

    /**   
    @dev Deletes poll from poll-linked-list by removing adjacent pointers and pointing to itself
    @param pollID Integer identifier associated with target poll
    */
    function deleteFromDll(uint pollID) internal {
        // get next and prev node pollIDs
        uint prevID = getAttribute(pollID, "prevID");
        uint nextID = getAttribute(pollID, "nextID");

        // remove node from list
        setAttribute(prevID, "nextID", nextID);
        setAttribute(nextID, "prevID", prevID);

        // set nodes prev and next to its own pollID
        setAttribute(pollID, "nextID", pollID); 
        setAttribute(pollID, "prevID", pollID); 
    }

    /**
    @dev Checks to see if poll placement is valid in sorted poll-linked-list
    @param numTokens The number of tokens to be committed towards target poll
    @param prevPollID Integer identifier pointing to previous poll in sorted poll-linked-list
    @return Boolean indication of correct placement in sorted poll-linked-list
    */
    function validateNode(uint prevPollID, uint pollID, uint numTokens) constant public returns (bool valid) {
        if (prevPollID == 0 && getNextID(prevPollID) == 0) {
            // Only the zero node exists
            return true;
        }

        uint prevNodeTokens = getNumTokens(prevPollID);
        // Check if the potential previous node has
        // less tokens than the current node
        if (prevNodeTokens <= numTokens) {
            uint nextNodeID = getNextID(prevPollID);

            // If the next is the current node, then we need to look at
            // the node after the current node (since next == current node
            // indicates an update validation is occurring)
            if (nextNodeID == pollID) {
                nextNodeID = getNextID(pollID);
            }
            uint nextNodeTokens = getNumTokens(nextNodeID);
            if (nextNodeID == 0 || numTokens <= nextNodeTokens) {
                return true;
            }
        }

        return false;
    }

    /**
    @dev Unlocks tokens locked in unrevealed vote where poll has ended
    @param pollID Integer identifier associated with the target poll
    */
    function rescueTokens(uint pollID) public {
        require(pollEnded(pollID));
        require(!hasBeenRevealed(pollID));
        deleteFromDll(pollID);
    }

    /**
    @dev Wrapper for getAttribute with attrName="prevID"
    @param pollID Integer identifier associated with target poll
    @return Integer identifier pointing to previous poll in sorted poll-linked-list
    */
    function getPreviousID(uint pollID) constant public returns (uint prevPollID) {
        return getAttribute(pollID, "prevID");
    }

    /**
    @dev Wrapper for getAttribute with attrName="nextID"
    @param pollID Integer identifier associated with target poll
    @return Integer identifier pointing to next poll in sorted poll-linked-list
    */
    function getNextID(uint pollID) constant public returns (uint nextPollID) {
        return getAttribute(pollID, "nextID");
    }

    /**
    @dev Wrapper for getAttribute with attrName="numTokens"
    @param pollID Integer identifier associated with target poll
    @return Number of tokens committed to poll in sorted poll-linked-list
    */
    function getNumTokens(uint pollID) constant public returns (uint numTokens) {
        return getAttribute(pollID, "numTokens");
    }

    /**
    @dev Gets top element of sorted poll-linked-list
    @return Integer identifier to poll with maximum number of tokens committed to it
    */
    function getLastNode() constant public returns (uint pollID) {
        return getAttribute(0, "prevID");
    }

    /**
    @dev Gets the numTokens property of getLastNode
    @return Maximum number of tokens committed in poll specified 
    */
    function getMaxTokens() constant public returns (uint numTokens) {
        return getAttribute(getLastNode(), "numTokens");
    }
    
    /**
    @dev Checks if user has enough votingTokens for committing
    @param numTokens Number of votingTokens to be committed
    @return Boolean indication of whether user is approved to proceed committing numTokens
    */
    function hasEnoughTokens(uint numTokens) constant public returns (bool hasEnough) {
        return voteTokenBalance[msg.sender] >= numTokens;
    }
 
    // ----------------
    // GENERAL HELPERS:
    // ----------------

    /**
    @dev Limits access to powerful/dangerous functions
    @param user Address to check owner against
    @return owner Boolean indicating if user matches owner
    */
    function isOwner(address user) constant public returns (bool wasOwner) {
        return user == owner;
    }

    /**
    @dev Checks if an expiration date has been reached
    @param terminationDate Integer timestamp of date to compare current timestamp with
    @return expired Boolean indication of whether the terminationDate has passed
    */
    function isExpired(uint terminationDate) constant public returns (bool expired) {
        return (block.timestamp > terminationDate);
    }
}
