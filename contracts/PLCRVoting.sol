pragma solidity ^0.4.4;

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
    uint public commitDuration;    /// length of commit period
    uint public revealDuration;    /// length of reveal period
    uint public voteQuota;

    mapping(address => bool) trustedMap; //maps addresses to trusted value

    /// CONSTRUCTOR:
    function PLCRVoting(address[] trusted) {
        for (uint idx = 0; idx < trusted.length; idx++) {
            trustedMap[trusted[idx]] = true;
        }

        pollNonce = INITIAL_POLL_NONCE;
        commitDuration = INITIAL_COMMIT_DURATION;
        revealDuration = INITIAL_REVEAL_DURATION;
        voteQuota = INITIAL_VOTE_QUOTA;
    }

    /// MODIFIERS:

    /// true if the msg.sender (or tx.origin) is in the trusted list
    function isTrusted(address user) returns (bool) {
        return trustedMap[user];
    }

    ///CORE FUNCTIONS:
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

    /*
     * Helper Functions
     */
 
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

    /// TODO: Implement (Yorke may have done this)
    modifier hasEnoughTokens(uint pollID) {
        require(true);
        _;
    }
    
    function getTotalNumberOfTokensForWinningOption(uint pollID) returns (uint) {
        require(pollEnded(pollID));
        if (isPassed(pollID)) {
            return pollMap[pollID].votesFor;
        } else {
            return pollMap[pollID].votesAgainst;
        }
    }
    
    // get any attribute that is not commitHash 
    function getAttribute(uint pollID, string attrName) returns (uint) {    
        return voteMap[sha3(msg.sender, pollID, attrName)]; 
    }
    
    function getCommitHash(uint pollID) returns (bytes32) { 
        return bytes32(voteMap[sha3(msg.sender, pollID, 'commitHash')]);    
    }
    
    function setAttribute(uint pollID, string attrName, uint attrVal) { 
        voteMap[sha3(msg.sender, pollID, attrName)] = attrVal;  
    }
}
