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
	bytes32 constant NODE_INVALID_COMMIT_HASH = 0x1337;

	function commitVote(uint pollID, 
		bytes32 hashOfVoteAndSalt, uint numTokens, 
		uint prevPollID) commitPeriodActive(pollID) 
		returns (bool) {

		VoteNode nodeToInsert;

		if (pollID == prevPollID) {
			// Prepare an existing node for validation
			nodeToInsert = voteMap[pollID];
			if (nodeToInsert)
			nodeToInsert.commitHash = hashOfVoteAndSalt;
			nodeToInsert.numTokens = numTokens;
		} else {
			// Prepare a new node for validation
			nodeToInsert = VoteNode({
				commitHash: hashOfVoteAndSalt,
				numTokens: numTokens,
				previousID: prevPollID
			});
		}

		VoteNode node = validateNode(nodeToInsert);

		// Node is valid
		if (node.commitHash != NODE_INVALID_COMMIT_HASH) {
			// Update a previous commit
			if (node.pollID == prevPollID) {
			/*
				TODO: Update the <node at poll ID> to equal <node>
			*/
			} else {
			/*
			TODO: Insert node into double linked-list
			*/
		}

		// Invalid prevPollID
		return false;
	}

	function validateNode(uint256 pollID, 
		uint256 prevPollID, uint256 numTokens) 
		returns (bool) {
			uint256 prevNodeTokens = getNumTokens(prevPollID);
			// Check if the potential previous node has
			// less tokens than the current node
			if (prevNodeTokens < numTokens) {
				uint256 nextNodeID = getNextID(prevPollID);
				uint256 nextNodeTokens = 
					getNumTokens(nextNodeID);
				if (getCommitHash(nextNodeID).commitHash == ZERO_NODE_COMMIT_HASH
					|| numTokens < nextNodeTokens) {
					//TODO: return should insert
					return true;
				} 
			}

			//TODO: return should not insert
			potentialNode.commitHash = NODE_INVALID_COMMIT_HASH;
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
