contract Voting {
	struct Poll {
		uint commitEndBlock;
		uint revealEndBlock;
		uint voteQuota;
		uint votesFor;
		uint votesAgainst;
	}

	mapping(uint => Poll) pollMap;

	// ARRAY WAY OF STORING USER VOTES:
	// struct Votes {
	// 	uint[] pollId;
	// 	uint[] numTokens;
	// 	bytes32[] hashCommit;
	// }
	// mapping(address => Votes) voteMap;
	// Pro: We don't need to store user to pollId list to iterate
	// Con: To store latest commit, we would have to know index of 
	//      specific polls
	// Result: cost incurred on user

	// MAPPING WAY OF STORING USER VOTES:
	struct Vote {
		uint numTokens;
		bytes32 hashCommit;
	}	
	mapping(address => mapping(uint => Vote)) voteMap;
	// Pro: We can overwrite latest commit in constant time
	// Con: We need to store list of PollIDs to iterate for max
	// Result: cost incurred on contract owner
}