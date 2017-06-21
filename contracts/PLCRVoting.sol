pragma solidity ^0.4.4;

contract PLCRVoting {
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

	function revealVote(uint pollID, 
		uint salt, bool voteOption) 
		revealPeriodActive(pollID) returns bool {

		/*
			TODO: Cem-- implement 'hasBeenRevealed'
		*/
		require(!hasBeenRevealed(pollID));

		bytes32 currHash = sha3(voteOption, salt);

		// Check if the hash from the input is the 
		// same as the commit hash
		if (currHash == getCommitHash(pollID)) {
			// Record the vote
			if (voteOption) {
				pollMap[pollID].votesFor++;
			} else {
				pollMap[pollID].votesAgainst++;
			}

			/*
				TODO: Delete the element from the double linked-list
				that corresponds to this poll for the msg sender
			*/
			return true;
		}
		return false;
	}

	function getPreviousID(uint pollID) returns (uint) {
		return uint(getAttribute(pollID, "prevID"));
	}

	function getNextID(uint pollID) returns (uint) {
		return uint(getAttribute(pollID, "nextID"));
	}

	function getNumTokens(uint pollID) returns (uint256) {
		return uint(getAttribute(pollID, "numTokens"));
	}

	function getCommitHash(uint pollID) returns (bytes32) {
		return getAttribute(pollID, "commitHash");
	}

	function getAttribute(uint pollID, string attrName) returns (bytes32) {
		return voteMap[sha3(msg.sender, pollID, attrName)];
	}

	function setAttribute(uint pollID, 
		string attrName, bytes32 attrVal) {
		voteMap[sha3(msg.sender, pollID, attrName)] = attrVal;
	}
}
