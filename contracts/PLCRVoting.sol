pragma solidity ^0.4.4;

contract PLCRVoting {
	struct Poll {
		uint commitEndDate; /// expiration date of commit period for poll
		uint revealEndDate; /// expiration date of reveal period for poll
		uint voteQuotaSnap;	/// snapshot of canonical voteQuota
		uint votesFor;		/// tally of votes supporting proposal
		uint votesAgainst;  /// tally of votes countering proposal
		string proposal;    /// proposal to be voted for/against
	}

	/// maps pollID to Poll struct
	mapping(uint => Poll) pollMap;
	uint pollNonce;

	/// maps hash of user's address and pollID to VoteNode struct
	mapping(bytes32 => uint) voteMap;  

	bytes32 constant ZERO_NODE_COMMIT_HASH = 0xabc;
	uint constant INITIAL_COMMIT_DURATION = 100;
	uint constant INITIAL_REVEAL_DURATION = 100;
	uint constant INITIAL_VOTE_QUOTA = 50;
	uint constant INITIAL_POLL_NONCE = 0;
	uint commitDuration;	/// length of commit period
	uint revealDuration;	/// length of reveal period
	address[] trusted;		/// list of trusted addresses

	/// CONSTRUCTOR:
	function Voting(address[] _trusted) {
		trusted = _trusted;
		pollNonce = INITIAL_POLL_NONCE;
		commitDuration = INITIAL_COMMIT_DURATION;
		revealDuration = INITIAL_REVEAL_DURATION;
	}

	/// MODIFIERS:
	/// true if the commit period is active (i.e. commit period expiration date not yet reached)
	modifier commitPeriodActive(uint pollID) {
		require(!isExpired(pollMap[pollID].commitEndDate));
		_;
	}

	/// true if the reveal period is active (i.e. reveal period expiration date not yet reached)
	modifier revealPeriodActive(uint pollID) {
		require(!isExpired(pollMap[pollID].revealEndDate));
		_;
	}

	/// true if the msg.sender (or tx.origin) is in the trusted list
	modifier isTrusted(address user) {
		for (uint idx = 0; idx < trusted.length; idx++) {
			if (user == trusted[idx]) return;
		}
		throw;
		_;
	}

	///CORE FUNCTIONS:
	function startPoll(string proposal, uint voteQuota) isTrusted(msg.sender) returns (uint) {
		pollNonce = pollNonce + 1;

		pollMap[pollNonce] = Poll({
			commitEndDate: block.timestamp + commitDuration,
			revealEndDate: block.timestamp + revealDuration,
			voteQuotaSnap: voteQuota,
			votesFor: 0,
			votesAgainst: 0,
			proposal: proposal
		});

		return pollNonce;
	}

	/// check if votesFor / (totalVotes) >= (voteQuota / 100) 
	function isPassed(uint pollID) returns (bool) {
		Poll poll = pollMap[pollID];
		require(isExpired(poll.revealEndDate));
		return ((100 - poll.voteQuotaSnap) * poll.votesFor) >= (poll.voteQuotaSnap * poll.votesAgainst);
	}

	///HELPER FUNCTIONS:
	/// determines if current timestamp is past termination timestamp 
	function isExpired(uint terminationDate) returns (bool) {
		return (block.timestamp > terminationDate);
	}

	/// true if the poll ID corresponds to a valid poll; false otherwise
	/// a valid poll can be defined as any poll that has been started (whether
	/// it has finished does not matter)
	function validPollID(uint pollID) returns (bool) {
		return pollMap[pollID].commitEndDate > 0;
	}

    /// sets the commit duration
    function setCommitDuration(uint _commitDuration) isTrusted(msg.sender) {
    	commitDuration = _commitDuration;
    }

    /// sets the reveal duration
    function setRevealDuration(uint _revealDuration) isTrusted(msg.sender) {
    	revealDuration = _revealDuration;
    }

	/// TODO: Implement (Yorke may have done this)
	modifier hasEnoughTokens(uint pollID) {
		require(true);
		_;
	}

	modifier pollEnded(uint pollID) {
		require(block.timestamp > pollMap[pollID].revealEndDate);
		_;
	}

	function getTotalNumberOfTokensForWinningOption(uint pollID) pollEnded(pollID)
		returns (uint) {
		Poll poll = pollMap[pollID];
		if (isPassed(pollID)) {
			return pollMap[pollID].votesFor;
		} else {
			return pollMap[pollID].votesAgainst;
		}
	}
}
