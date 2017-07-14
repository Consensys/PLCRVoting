require('./testHelpers.js')();

contract('User Demo Testing', function(accounts) {
    require('./testConf')(accounts);

    it("should test simple token requesting", () => {
        let contract;
        return getVoteContract()
            .then((instance) => contract = instance)
            .then(() => contract.requestVotingRights(50, {from:user[0]}))
            .then(() => contract.requestVotingRights(50, {from:user[1]}))
            .then(() => contract.requestVotingRights(100, {from:user[2]}))
            .catch((err) => assert.equal(re.test(err), false, "Error in requesting voting rights"))
            .then(() => contract.voteTokenBalance.call(user[0]))
            .then((balance) => assert.equal(balance, 50, "User0 balance not updated"))
            .then(() => contract.voteTokenBalance.call(user[1]))
            .then((balance) => assert.equal(balance, 50, "User1 balance not updated"))
            .then(() => contract.voteTokenBalance.call(user[2]))
            .then((balance) => assert.equal(balance, 100, "User2 balance not updated"));
    });

    it("should test repeat token requesting and attemps at over-requesting", () => {
        let contract;
        return getVoteContract()
            .then((instance) => contract = instance)
            .then(() => contract.requestVotingRights(50, {from:user[0]}))
            .catch((err) => assert.equal(re.test(err), false, "Error in requesting voting rights"))
            .then(() => contract.requestVotingRights(51, {from:user[1]}))
            .catch((err) => assert.equal(re.test(err), true, "Error in requesting voting rights"))
            .then(() => contract.requestVotingRights(50, {from:user[1]}))
            .catch((err) => assert.equal(re.test(err), false, "Error in requesting voting rights"))
            .then(() => contract.requestVotingRights(50, {from:user[3]}))
            .catch((err) => assert.equal(re.test(err), false, "Error in requesting voting rights"))
            .then(() => contract.requestVotingRights(25, {from:user[4]}))
            .catch((err) => assert.equal(re.test(err), true, "Error in requesting voting rights"))
            .then(() => contract.requestVotingRights(20, {from:user[4]}))
            .catch((err) => assert.equal(re.test(err), false, "Error in requesting voting rights"))

            .then(() => contract.voteTokenBalance.call(user[0]))
            .then((balance) => assert.equal(balance, 100, "User0 balance not updated"))
            .then(() => contract.voteTokenBalance.call(user[1]))
            .then((balance) => assert.equal(balance, 100, "User1 balance not updated"))
            .then(() => contract.voteTokenBalance.call(user[2]))
            .then((balance) => assert.equal(balance, 100, "User2 balance not updated"))
            .then(() => contract.voteTokenBalance.call(user[3]))
            .then((balance) => assert.equal(balance, 50, "User3 balance not updated"))
            .then(() => contract.voteTokenBalance.call(user[4]))
            .then((balance) => assert.equal(balance, 20, "User4 balance not updated"));
    });

    it("should test simple votes for multiple users", () => {
        let arraySalts = [20, 10, 420, 666];
        let arrayVoteOption = [0, 1, 1, 0];
        let contract;
        let pollA;
        return getVoteContract()
            .then((instance) => contract = instance)
            .then(() => launchPoll("Mike grows out long hair", commitDuration, revealDuration))
            .then((result) => pollA = result)
            .then(() => contract.commitVote(pollA, createVoteHash(arrayVoteOption[0], arraySalts[0]), 101, 0, {from:user[0]}))
            .catch((err) => assert.equal(re.test(err), true, "Committing too many tokens"))
            .then(() => contract.commitVote(pollA, createVoteHash(arrayVoteOption[1], arraySalts[1]), 100, 0, {from:user[1]}))
            .then(() => contract.commitVote(pollA, createVoteHash(arrayVoteOption[2], arraySalts[2]), 75, 0, {from:user[2]}))
            .then(() => contract.commitVote(pollA, createVoteHash(arrayVoteOption[3], arraySalts[3]), 25, 0, {from:user[3]}))
            .then(() => increaseTime(commitDuration + 1))
            .then(() => contract.revealVote(pollA, arraySalts[0], arrayVoteOption[0])) 
            .catch((err) => assert.equal(re.test(err), true, "Revealing vote that should not been committed"))
            .then(() => contract.commitVote(pollA, createVoteHash(arrayVoteOption[0], arraySalts[0]), 10, 0, {from:user[0]}))
            .catch((err) => assert.equal(re.test(err), true, "Committing during reveal period"))
            .then(() => contract.revealVote(pollA, arraySalts[1], arrayVoteOption[1])) 
            .then(() => contract.revealVote(pollA, arraySalts[2], arrayVoteOption[2])) 
            .then(() => contract.revealVote(pollA, arraySalts[3], arrayVoteOption[3])) 
            .then(() => increaseTime(revealDuration + 1))
            .then(() => contract.isPassed.call(pollA))
            .then((result) => assert.equal(result, true, "Poll should have passed but did not"));
    });
});
