pragma solidity ^0.4.8;

import "./HumanStandardToken.sol";

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

	HumanStandardToken public token;

	/// maps user's address to voteToken balance
	mapping(address => uint) public voteTokenBalance;

	function PLCRVoting(address tokenAddr) {
		token = HumanStandardToken(tokenAddr);
	}

	/// interface for users to purchase votingTokens by exchanging ERC20 token
	function loadTokens(uint numTokens) {
		require(token.balanceOf(msg.sender) >= numTokens);
		require(token.transferFrom(msg.sender, this, numTokens));
		voteTokenBalance[msg.sender] += numTokens;
	}

	/// interface for users to withdraw votingTokens and exchange for ERC20 token
	function withdrawTokens(uint numTokens) {
		uint availableTokens = voteTokenBalance[msg.sender] - getMaxVoted(msg.sender);
		require(availableTokens >= numTokens);
		require(token.transfer(msg.sender, numTokens));
		voteTokenBalance[msg.sender] -= numTokens;
	}

	function getMaxVoted(address user) returns (uint) {
		user = user;
		return 0; //just for testing
	}
}
