const VotingContract = artifacts.require("./PLCRVoting.sol");
const HumanStandardToken = artifacts.require("./HumanStandardToken.sol");

contract('PLCRVoting', (accounts) => {
	const [owner, user1, user2, user3] = accounts;
	const tokenAmt = 10;

	function getERC20Token() {
		return VotingContract.deployed()
		.then((vote) => vote.token.call())
		.then((tokenAddr) => HumanStandardToken.at(tokenAddr));
	}

	function errorTrace(err, assertMsg) {
		assert.ok(false, assertMsg);
		throw new Error(err);
	}

	// before(() => getERC20Token());

	it("should distribute 50 ERC20 to user1", () => {
		return getERC20Token()
		.then((token) => token.transfer(user1, 50, {from: owner}))
		.catch((err) => errorTrace(err, "Transaction failed"));
	});

	it("should approve ERC20 contract to transfer tokenAmt tokens to voting contract on behalf of user1", () => {
		let votingAddr;
		return VotingContract.deployed()
		.then((vote) => {votingAddr = vote.address;})
		.then(() => getERC20Token())
		.then((token) => token.approve(votingAddr, tokenAmt, {from: user1}))
		.catch((err) => errorTrace(err, "Transaction failed"));
	});

	it("should exchange tokenAmt of user1's ERC20 for tokenAmt of voting tokens", () => {
		return VotingContract.deployed()
		.then((vote) => vote.loadTokens(tokenAmt, {from: user1}))
		.catch((err) => errorTrace(err, "Load failed"));
	});

	it("should exchange tokenAmt of user1's voting tokens for tokenAmt of ERC20", () => {
		return VotingContract.deployed()
		.then((vote) => vote.withdrawTokens(tokenAmt, {from: user1}))
		.catch((err) => errorTrace(err, "Withdraw failed"));
	});
});