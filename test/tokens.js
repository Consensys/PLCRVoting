const VotingContract = artifacts.require("./PLCRVoting.sol");
const HumanStandardToken = artifacts.require("./HumanStandardToken.sol");
/*
contract('Token Testing', (accounts) => {
	const [owner, user1, user2, user3] = accounts;
	const tokenAmt = 10;

	function getVoteContract() {
		return VotingContract.deployed();
	}

	function getERC20Token() {
		return getVoteContract()
		.then((vote) => vote.token.call())
		.then((tokenAddr) => HumanStandardToken.at(tokenAddr));
	}

	it("should distribute 50 ERC20 to user1", () => {
		let tokenInstance;

		return getERC20Token()
		.then((token) => tokenInstance = token)
		.then(() => tokenInstance.transfer(user1, 50, {from: owner}))
		.then(() => tokenInstance.balanceOf.call(user1))
		.then((balance) => assert.equal(balance, 50, "Token Balance not updated"));
	});

	it("should approve ERC20 contract to transfer 50 tokens to voting contract on behalf of user1", () => {
		let votingAddr;
		let tokenInstance;

		return getVoteContract()
		.then((vote) => {votingAddr = vote.address;})
		.then(() => getERC20Token())
		.then((token) => tokenInstance = token)
		.then(() => tokenInstance.approve(votingAddr, 50, {from: user1}))
		.then(() => tokenInstance.allowance.call(user1, votingAddr))
		.then((allowance) => assert.equal(allowance, 50, "Approval failed"));
	});

	it("should exchange 25 of user1's ERC20 for 25 voting tokens", () => {
		let voteInstance;

		return getVoteContract()
		.then((vote) => voteInstance = vote)
		.then(() => voteInstance.loadTokens(25, {from: user1}))
		.then(() => voteInstance.voteTokenBalance.call(user1))
		.then((balance) => assert.equal(balance, 25, "Vote Balance not updated"));
	});

	it("should exchange 10 of user1's voting tokens back to 10 ERC20", () => {
		let voteInstance;

		return getVoteContract()
		.then((vote) => voteInstance = vote)
		// .then(() => console.log("CHECK1"))
		.then(() => voteInstance.withdrawTokens(10, {from: user1}))
		// .then(() => console.log("CHECK2"))
		.then(() => voteInstance.voteTokenBalance.call(user1))
		.then((balance) => assert.equal(balance, 15, "Vote Balance not updated"));
		// .then(() => console.log("CHECK3"));
	});
});*/
