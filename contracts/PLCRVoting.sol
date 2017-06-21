contract Voting {
	struct Poll {
		uint commitEndDate; /// expiration date of commit period for poll
		uint revealEndDate; /// expiration date of reveal period for poll
		uint voteQuota;	    /// snapshot of canonical voteQuota
		uint votesFor;	    /// tally of votes supporting proposal
		uint votesAgainst;  /// tally of votes countering proposal
	}
	/// maps pollID to Poll struct
	mapping(uint => Poll) pollMap; 

        /// represent a double linked list through mapping
	/// sha3(userAddress, pollID, "prevID") => byte32 prevID
	/// sha3(userAddress, pollID, "nextID") => byte32 nextID
	/// sha3(userAddress, pollID, "numTokens") => byte32 numTokens
	/// sha3(userAddress, pollID, "commitHash") => byte32 commitHash
	mapping(bytes32 => bytes32) voteMap;  

	uint commitDuration;	/// length of commit period
	uint revealDuration;	/// length of reveal period
	uint voteQuota;		/// type of majority necessary for winning poll
	address[] trusted;	/// list of trusted addresses

	function getAttribute(bytes32 pollID, string attrName) returns (bytes32) {
          return voteMap[sha3(msg.sender, pollID, attrName)];
	}

	function setAttribute(bytes32 pollID, string attrName, bytes32 attrVal) {
          voteMap[sha3(msg.sender, pollID, attrName)] = attrVal;
	}
}
