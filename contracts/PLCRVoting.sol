pragma solidity ^0.4.8;

import "./HumanStandardToken.sol";

contract PLCRVoting {
    struct Poll {
        uint commitEndDate;     /// expiration date of commit period for poll
        uint revealEndDate;     /// expiration date of reveal period for poll
        uint voteQuotaSnap;	/// snapshot of canonical voteQuota
        uint votesFor;		/// tally of votes supporting proposal
        uint votesAgainst;      /// tally of votes countering proposal
        string proposal;        /// proposal to be voted for/against
    }
    
    /// maps pollID to Poll struct
    mapping(uint => Poll) public pollMap;
    uint pollNonce;
    event PollCreated(uint pollID);

    /// maps user"s address to voteToken balance
    mapping(address => uint) public voteTokenBalance;

    // represent a double linked list through mapping
    // sha3(userAddress, pollID, "prevID") => byte32 prevID
    // sha3(userAddress, pollID, "nextID") => byte32 nextID
    // sha3(userAddress, pollID, "numTokens") => byte32 numTokens
    // sha3(userAddress, pollID, "commitHash") => byte32 commitHash
    mapping(bytes32 => uint) public voteMap;  

    bytes32 constant ZERO_NODE_COMMIT_HASH = 0xabc;
    uint constant INITIAL_COMMIT_DURATION = 100;
    uint constant INITIAL_REVEAL_DURATION = 100;
    uint constant INITIAL_VOTE_QUOTA = 50;
    uint constant INITIAL_POLL_NONCE = 0;
 
    uint public commitDuration;        /// length of commit period
    uint public revealDuration;        /// length of reveal period
    uint public voteQuota;             /// type of majority necessary for winning poll
    mapping(address => bool) trustedMap; //maps addresses to trusted value

    HumanStandardToken public token;

    function PLCRVoting(address tokenAddr, address[] trusted) {
        token = HumanStandardToken(tokenAddr);
        for (uint idx = 0; idx < trusted.length; idx++) {
            trustedMap[trusted[idx]] = true;
        }

        pollNonce = INITIAL_POLL_NONCE;
        commitDuration = INITIAL_COMMIT_DURATION;
        revealDuration = INITIAL_REVEAL_DURATION;
        voteQuota = INITIAL_VOTE_QUOTA;
    }

    function startPoll(string proposalStr, uint voteQuota) {
        pollNonce = pollNonce + 1;

        pollMap[pollNonce] = Poll({
            commitEndDate: block.timestamp + commitDuration,
            revealEndDate: block.timestamp + commitDuration + revealDuration,
            voteQuotaSnap: voteQuota,
            votesFor: 0,
            votesAgainst: 0,
            proposal: proposalStr
        });

        PollCreated(pollNonce);
    }

    /// interface for users to purchase votingTokens by exchanging ERC20 token
    function loadTokens(uint numTokens) {
        require(token.balanceOf(msg.sender) >= numTokens);
        require(token.transferFrom(msg.sender, this, numTokens));
        voteTokenBalance[msg.sender] += numTokens;
    }

    /// interface for users to withdraw votingTokens and exchange for ERC20 token
    function withdrawTokens(uint numTokens) {
        uint availableTokens = voteTokenBalance[msg.sender] - getMaxTokens();
        require(availableTokens >= numTokens);
        require(token.transfer(msg.sender, numTokens));
        voteTokenBalance[msg.sender] -= numTokens;
    }
    
    // insert to double-linked-list given that the prevID is valid
    function insertToDll(uint pollID, uint prevID, uint numTokens, bytes32 commitHash){
        uint nextID = uint(getAttribute(prevID, "nextID"));

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

    // delete node from double-linked-list by removing pointers to the node, and 
    // setting its prev and next to its own pollID
    function deleteNode(uint pollID){
        // get next and prev node pollIDs
        uint prevID = uint(getAttribute(pollID, "prevID"));
        uint nextID = uint(getAttribute(pollID, "nextID"));

        // remove node from list
        setAttribute(prevID, "nextID", nextID);
        setAttribute(nextID, "prevID", prevID);

        // set nodes prev and next to its own pollID
        setAttribute(pollID, "nextID", pollID); 
        setAttribute(pollID, "prevID", pollID); 
    }

    // return the pollID of the last node in a dll
    function getLastNode() returns (uint){
        return getAttribute(0, "prevID");
    }

    /*
     *  Helper Functions
     */

    // return max number of tokens locked for user
    function getMaxTokens() returns (uint) {
        return getAttribute(getLastNode(), "numTokens");
    }

    // return any attribute that is not commitHash 
    function getAttribute(uint pollID, string attrName) returns (uint) {
        return voteMap[sha3(msg.sender, pollID, attrName)];
    }

    function getCommitHash(uint pollID) returns (bytes32) {
        return bytes32(voteMap[sha3(msg.sender, pollID, "commitHash")]);
    }

    function setAttribute(uint pollID, string attrName, uint attrVal) {
        voteMap[sha3(msg.sender, pollID, attrName)] = attrVal;
    }
    
    /// true if the msg.sender (or tx.origin) is in the trusted list
    function isTrusted(address user) returns (bool) {
        return trustedMap[user];
    }

    /// check if votesFor / (totalVotes) >= (voteQuota / 100) 
    function isPassed(uint pollID) returns (bool) {
        Poll poll = pollMap[pollID];
        require(isExpired(poll.revealEndDate));
        return ((100 - poll.voteQuotaSnap) * poll.votesFor) >= (poll.voteQuotaSnap * poll.votesAgainst);
    }

    /// determines if current timestamp is past termination timestamp 
    function isExpired(uint terminationDate) returns (bool) {
        return (block.timestamp > terminationDate);
    }

    /// true if the commit period is active (i.e. commit period expiration date not yet reached)
    function commitPeriodActive(uint pollID) returns (bool) {
        return !isExpired(pollMap[pollID].commitEndDate);
    }

    /// true if the reveal period is active (i.e. reveal period expiration date not yet reached)
    function revealPeriodActive(uint pollID) returns (bool) {
        return !isExpired(pollMap[pollID].revealEndDate);
    }

    /// true if the poll ID corresponds to a valid poll; false otherwise
    /// a valid poll can be defined as any poll that has been started (whether
    /// it has finished does not matter)
    function validPollID(uint pollID) returns (bool) {
        return pollMap[pollID].commitEndDate > 0;
    }

    /// sets the commit duration
    function setCommitDuration(uint _commitDuration) {
        require(isTrusted(msg.sender));
        commitDuration = _commitDuration;
    }

    /// sets the reveal duration
    function setRevealDuration(uint _revealDuration) {
        require(isTrusted(msg.sender));
        revealDuration = _revealDuration;
    }

    function setVoteQuota(uint _voteQuota) {
        require(isTrusted(msg.sender));
        voteQuota = _voteQuota;
    }

    function pollEnded(uint pollID) returns (bool) {
        return isExpired(pollMap[pollID].revealEndDate);
    }

    function getTotalNumberOfTokensForWinningOption(uint pollID) returns (uint) {
        require(pollEnded(pollID));
        if (isPassed(pollID)) {
            return pollMap[pollID].votesFor;
        } else {
            return pollMap[pollID].votesAgainst;
        }
    }
}
