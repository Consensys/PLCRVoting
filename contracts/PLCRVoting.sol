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

	bytes32 constant ZERO_NODE_COMMIT_HASH = 0xabc;
	bytes32 constant NODE_INVALID_COMMIT_HASH = 0x1337;

	function validateNode(VoteNode potentialNode) 
		returns (VoteNode) {
			VoteNode prevNode = voteMap[sha3(msg.sender, prevPollID)];
		
			// Check if the potential previous node has
			// less tokens than the current node
			if (potentialPrevNode.numTokens < numTokens) {
				VoteNode potentialNextNode = 
					voteMap[sha3(msg.sender, potentialPrevNode.nextID)];
				if (potentialNextNode.commitHash == ZERO_NODE_COMMIT_HASH
					|| numTokens < potentialNextNode.numTokens) {
					// Good to insert since the next node is the zero node
					// or the next node has more tokens 
					// than the current node
					potentialNode.previousID = prevPollID;
					potentialNode.nextID = potentialPrevNode.nextID;

					// Update the previous/next nodes to point to
					// the new node
					potentialPrevNode.nextID = pollID;
					potentialNextNode.previousID = pollID;

					return potentialNode;
				} 
			}
			potentialNode.commitHash = NODE_INVALID_COMMIT_HASH;
			return potentialNode;
		}

}
