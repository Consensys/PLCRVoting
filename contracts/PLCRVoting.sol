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
		uint256 numTokens;		/// number of tokens attached to vote
		uint256 previousID;    /// reference to previous vote node
		uint256 nextID;		/// reference to following vote node 
	}

	/// maps hash of user's address and pollID to VoteNode struct
	mapping(bytes32 => VoteNode) voteMap;  

	uint commitDuration;	/// length of commit period
	uint revealDuration;	/// length of reveal period
	uint voteQuota;			/// type of majority necessary for winning poll
	address[] trusted;		/// list of trusted addresses

	bytes32 constant ZERO_NODE_COMMIT_HASH = 0xabc;

	function commitVote(uint pollID, 
		bytes32 hashOfVoteAndSalt, uint numTokens, 
		uint prevPollID) commitPeriodActive(pollID) 
		returns (bool) {

		// Make sure user is not trying to manually commit
		// a vote corresponding the zero node
		require(pollID != 0);

		// Check to see if we are making an update
		// as opposed to an insert
		bool isUpdatingExistingNode = false;
		if (pollID == prevPollID) {
			// Making an update --> the previous node
			// has already been set, and so that
			// node can be used for validation
			prevPollID = getPreviousID(pollID);

			// Check to see if the previous poll ID was not set,
			// which would imply that poll ID can not be valid
			if (prevPollID == 0) {
				return false;
			}

			isUpdatingExistingNode = true;
		} 

		// Determine if the new node can be inserted/updated
		// at the given spot (i.e. the node right after prevPollID)
		bool isValid = 
			validateNode(prevPollID, numTokens);

		// Node is valid
		if (isValid) {
			// Update a previous commit
			if (isUpdatingExistingNode) {
				/*
					TODO: Update the <node at poll ID>:
						update numTokens attribute
						update commitHash attribute
				*/
			} else {
				/*
					TODO: insert the <node at poll ID> after
					the node at <prevPollID>:

				*/

				// Check if the zero node is the only node
				// in the double-linked list
				if (prevPollID == 0 
					&& getNextID(prevPollID) == 0) {
					/*
						TODO: insert the >node at poll ID> after
						the zero node 
					*/
				}
			}
		}

		// Invalid prevPollID
		return false;
	}

	function validateNode(uint256 prevPollID, uint256 numTokens) 
		returns (bool) {
			if (prevPollID == 0 
				&& getNextID(prevPollID) == 0) {
				// Only the zero node exists
				return true;
			}

			uint256 prevNodeTokens = getNumTokens(prevPollID);
			// Check if the potential previous node has
			// less tokens than the current node
			if (prevNodeTokens <= numTokens) {
				uint256 nextNodeID = getNextID(prevPollID);
				uint256 nextNodeTokens = 
					getNumTokens(nextNodeID);
				if (getCommitHash(nextNodeID).commitHash == ZERO_NODE_COMMIT_HASH
					|| numTokens <= nextNodeTokens) {
					return true;
				} 
			}

			return false;
		}

	function getPreviousID(bytes32 pollID) returns (bytes32) {
		return getAttribute(pollID, "prevID");
	}

	function getNextID(bytes32 pollID) returns (bytes32) {
		return getAttribute(pollID, "nextID");
	}

	function getNumTokens(bytes32 pollID) returns (bytes32) {
		return getAttribute(pollID, "numTokens");
	}

	function getCommitHash(bytes32 pollID) returns (bytes32) {
		return getAttribute(pollID, "commitHash");
	}

	function getAttribute(bytes32 pollID, string attrName) returns (bytes32) {
		return voteMap[sha3(msg.sender, pollID, attrName)];
	}

	function setAttribute(bytes32 pollID, 
		string attrName, bytes32 attrVal) {
		voteMap[sha3(msg.sender, pollID, attrName)] = attrVal;
	}
}
