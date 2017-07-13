require('./testHelpers.js')();

contract('Token Testing', (accounts) => {
    require('./testConf')(accounts);
    const tokenAmt = 10;

    it("should exchange user[0]'s 100 ERC20 for voting tokens", () => {
	let vote;

	return getVoteContract()
	    .then((voteInstance) => vote = voteInstance)
	    .then(() => vote.requestVotingRights(100, {from: user[0]}))
	    .then(() => vote.voteTokenBalance.call(user[0]))
	    .then((voteBalance) => assert.equal(voteBalance, 100, "voteToken balance not updated"))
	    .then(() => getERC20Token())
	    .then((token) => token.balanceOf.call(user[0]))
	    .then((tokenBalance) => assert.equal(tokenBalance, 0, "ERC20 token balance not updated"));
    });

    it("should reject user[1]'s request to exchange 300 ERC20 for voting tokens", () => {
	let vote;

	return getVoteContract()
	    .then((voteInstance) => vote = voteInstance)
	    .then(() => vote.requestVotingRights(300, {from: user[1]}))
	    .then(() => assert.ok(false, "exchange was successful"))
	    .catch((err) => vote.voteTokenBalance.call(user[1]))
	    .then((voteBalance) => assert.equal(voteBalance, 0, "voteToken balance updated"))
	    .then(() => getERC20Token())
	    .then((token) => token.balanceOf.call(user[1]))
	    .then((tokenBalance) => assert.equal(tokenBalance, 200, "ERC20 token balance updated"));
    });

    it("should withdraw user[0]'s 100 ERC20 for voting tokens", () => {
	let vote;

	return getVoteContract()
	    .then((voteInstance) => vote = voteInstance)
	    .then(() => vote.withdrawVotingRights(100, {from :user[0]}))
	    .then(() => vote.voteTokenBalance.call(user[0]))
	    .then((voteBalance) => assert.equal(voteBalance, 0, "voteToken balance not updated"))
	    .then(() => getERC20Token())
	    .then((token) => token.balanceOf.call(user[0]))
	    .then((tokenBalance) => assert.equal(tokenBalance, 100, "ERC20 token balance not updated"));
    });

    it("should reject user[1]'s request to withdraw 300 ERC20 for voting tokens", () => {
	let vote;

	return getVoteContract()
	    .then((voteInstance) => vote = voteInstance)
	    .then(() => vote.withdrawVotingRights(300, {from: user[1]}))
	    .then(() => assert.ok(false, "exchange was successful"))
	    .catch((err) => vote.voteTokenBalance.call(user[1]))
	    .then((voteBalance) => assert.equal(voteBalance, 0, "voteToken balance updated"))
	    .then(() => getERC20Token())
	    .then((token) => token.balanceOf.call(user[1]))
	    .then((tokenBalance) => assert.equal(tokenBalance, 200, "ERC20 token balance updated"));
    });
});
