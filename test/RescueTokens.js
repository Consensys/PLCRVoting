require('./testHelpers.js')();

contract('Rescue Tokens', function(accounts) {
    require('./testConf')(accounts);

    let commitDuration = 1000;
    let revealDuration = 1000;
    it("should test simple rescue tokens for unrevealed vote (poll ended)", () => {
        let contract;
        let pollID;
        return getVoteContract()
            .then((instance) => contract = instance)
            .then(() => contract.requestVotingRights(50, {from:user[0]}))
            .then(() => launchPoll("I am legend", commitDuration, revealDuration))
            .then((_pollID) => pollID = _pollID)
            .then(() => contract.commitVote(pollID, createVoteHash(0, 4), 50, 0, {from: user[0]}))
            .then(() => increaseTime(commitDuration + revealDuration + 1))
            .then(() => contract.withdrawVotingRights(25, {from: user[0]}))
            .catch((err) => assert.equal(re.test(err), true, "Error in withdrawing voting rights"))
            .then(() => contract.voteTokenBalance.call(user[0]))
            .then((balance) => assert.equal(50, balance, "balance should not have been changed"))
            .then(() => contract.rescueTokens(pollID, {from: user[0]}))
            .then(() => contract.withdrawVotingRights(25, {from: user[0]}))
            .then(() => contract.voteTokenBalance.call(user[0]))
            .then((balance) => assert.equal(25, balance, "balance should have been changed"));
    });

    it("should test simple rescue tokens for revealed vote (poll ended)", () => {
        let contract;
        let pollID;
        let vote = {
            option: 1,
            salt: 3
        };
        return getVoteContract()
            .then((instance) => contract = instance)
            .then(() => contract.requestVotingRights(50, {from:user[1]}))
            .then(() => launchPoll("I am legend", commitDuration, revealDuration))
            .then((_pollID) => pollID = _pollID)
            .then(() => contract.commitVote(pollID, createVoteHash(vote.option, vote.salt), 50, 0, {from: user[1]}))
            .then(() => increaseTime(commitDuration + 1))
            .then(() => contract.revealVote(pollID, vote.salt, vote.option, {from: user[1]}))
            .then(() => increaseTime(revealDuration))
            .then(() => contract.rescueTokens(pollID, {from: user[1]}))
            .catch((err) => assert.equal(re.test(err), true, "Error in rescue for revealed tokens"))
            .then(() => contract.withdrawVotingRights(25, {from: user[1]}))
            .then(() => contract.voteTokenBalance.call(user[1]))
            .then((balance) => assert.equal(25, balance, "balance should have been changed"));
    });


});
