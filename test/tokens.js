const PLCRVoting = artifacts.require("./PLCRVoting.sol");
const HumanStandardToken = artifacts.require("./HumanStandardToken.sol");

contract('Token Testing', (accounts) => {
    const [owner, user1, user2, user3] = accounts;
    const tokenAmt = 10;

    function getVoteContract() {
	return PLCRVoting.deployed();
    }

    function getERC20Token() {
	return getVoteContract()
	    .then((vote) => vote.token.call())
	    .then((tokenAddr) => HumanStandardToken.at(tokenAddr));
    }

    it("should exchange user1's 100 ERC20 for voting tokens", () => {
	let vote;

	return getVoteContract()
	    .then((voteInstance) => vote = voteInstance)
	    .then(() => vote.loadTokens(100, {from: user1}))
	    .then(() => vote.voteTokenBalance.call(user1))
	    .then((voteBalance) => assert.equal(voteBalance, 100, "voteToken balance not updated"))
	    .then(() => getERC20Token())
	    .then((token) => token.balanceOf.call(user1))
	    .then((tokenBalance) => assert.equal(tokenBalance, 0, "ERC20 token balance not updated"));
    });

    it("should reject user2's request to exchange 300 ERC20 for voting tokens", () => {
	let vote;

	return getVoteContract()
	    .then((voteInstance) => vote = voteInstance)
	    .then(() => vote.loadTokens(300, {from: user2}))
	    .then(() => assert.ok(false, "exchange was successful"))
	    .catch((err) => vote.voteTokenBalance.call(user2))
	    .then((voteBalance) => assert.equal(voteBalance, 0, "voteToken balance updated"))
	    .then(() => getERC20Token())
	    .then((token) => token.balanceOf.call(user2))
	    .then((tokenBalance) => assert.equal(tokenBalance, 200, "ERC20 token balance updated"));
    });

    it("should withdraw user1's 100 ERC20 for voting tokens", () => {
	let vote;

	return getVoteContract()
	    .then((voteInstance) => vote = voteInstance)
	    .then(() => vote.withdrawTokens(100, {from :user1}))
	    .then(() => vote.voteTokenBalance.call(user1))
	    .then((voteBalance) => assert.equal(voteBalance, 0, "voteToken balance not updated"))
	    .then(() => getERC20Token())
	    .then((token) => token.balanceOf.call(user1))
	    .then((tokenBalance) => assert.equal(tokenBalance, 100, "ERC20 token balance not updated"));
    });

    it("should reject user2's request to withdraw 300 ERC20 for voting tokens", () => {
	let vote;

	return getVoteContract()
	    .then((voteInstance) => vote = voteInstance)
	    .then(() => vote.withdrawTokens(300, {from: user2}))
	    .then(() => assert.ok(false, "exchange was successful"))
	    .catch((err) => vote.voteTokenBalance.call(user2))
	    .then((voteBalance) => assert.equal(voteBalance, 0, "voteToken balance updated"))
	    .then(() => getERC20Token())
	    .then((token) => token.balanceOf.call(user2))
	    .then((tokenBalance) => assert.equal(tokenBalance, 200, "ERC20 token balance updated"));
    });
});
