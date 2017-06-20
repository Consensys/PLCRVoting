contract Voting {
	struct Poll {
		uint commitEndBlock;
		uint revealEndBlock;
		uint voteQuota;
		uint votesFor;
		uint votesAgainst;
	}

	mapping(uint => Poll) pollMap;

	struct VoteNode {
		bytes32 commitHash;
		uint numTokens;
		uint previousID;
		uint nextID;
	}

	mapping(bytes32 => VoteNode) voteMap;

	uint commitDuration;
	uint revealDuration;
	uint voteQuota;
	address[] trusted;
}
