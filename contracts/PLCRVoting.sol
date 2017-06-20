contract Voting {
	struct Poll {
		uint commitEndDate; /// expiration date of commit period for poll
		uint revealEndDate; /// expiration date of reveal period for poll
		uint voteQuota;		/// snapshot of canonical voteQuota
		uint votesFor;		/// tally of votes supporting proposal
		uint votesAgainst;  /// tally of votes countering proposal
	}

	/// maps pollID to Poll struct
	mapping(uint => Poll) pollMap; 

	struct VoteNode {
		bytes32 commitHash; /// hash of vote option and salt
		uint numTokens;		/// number of tokens attached to vote
		uint previousID;    /// reference to previous vote node
		uint nextID;		/// reference to following vote node 
	}

	/// maps hash of user's address and pollID to VoteNode struct
	mapping(bytes32 => VoteNode) voteMap;  

	uint commitDuration;	/// length of commit period
	uint revealDuration;	/// length of reveal period
	uint voteQuota;			/// type of majority necessary for winning poll
	address[] trusted;		/// list of trusted addresses

	function Voting(address[] _trusted) {
		trusted = _trusted;
	}

	/// MODIFIERS:
	/// true if the commit period is active (i.e. commit period expiration date not yet reached)
	modifier commitPeriodActive(uint pollID) {
		require(
			!isExpired(pollMap[pollID].commitEndDate)
		);
		_;
	}

	/// true if the reveal period is active (i.e. reveal period expiration date not yet reached)
	modifier revealPeriodActive(uint pollID) {
		require(
			!isExpired(pollMap[pollID].revealEndDate)
		);
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

	///HELPER FUNCTIONS:
	/// determines if current timestamp is past termination timestamp 
	function isExpired(uint terminationDate) returns (bool) {
		return (block.timestamp > terminationDate);
	}

	/// true if the poll ID corresponds to a valid poll; false otherwise
	function validPollID(uint pollID) returns (bool) {
		/// NOT YET IMPLEMENTED
	}
}
