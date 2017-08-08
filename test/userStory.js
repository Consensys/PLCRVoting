require('./testHelpers.js')();

contract('User Demo Testing', function(accounts) {
    require('./testConf')(accounts);

    let poll1, poll2, poll3, poll4;
    it("should test simple token requesting", () => {
        let contract;
        return getVoteContract()
            .then((instance) => contract = instance)
            .then(() => contract.requestVotingRights(50, {from:user[0]}))
            .then(() => contract.requestVotingRights(50, {from:user[1]}))
            .then(() => contract.requestVotingRights(100, {from:user[2]}))
            .then(() => contract.voteTokenBalance.call(user[0]))
            .then((balance) => assert.equal(balance, 50, "User0 balance not updated"))
            .then(() => contract.voteTokenBalance.call(user[1]))
            .then((balance) => assert.equal(balance, 50, "User1 balance not updated"))
            .then(() => contract.voteTokenBalance.call(user[2]))
            .then((balance) => assert.equal(balance, 100, "User2 balance not updated"));
    });

    it("should test repeat token requesting and attempts at over-requesting", () => {
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
        return getVoteContract()
            .then((instance) => contract = instance)
            
            .then(() => launchPoll("Mike grows out long hair", commitDuration, revealDuration))
            .then((result) => poll1 = result)
            
            .then(() => contract.commitVote(poll1, createVoteHash(arrayVoteOption[0], arraySalts[0]), 101, 0, {from:user[0]}))
            .catch((err) => assert.equal(re.test(err), true, "Committing too many tokens"))
            
            .then(() => contract.commitVote(poll1, createVoteHash(arrayVoteOption[1], arraySalts[1]), 100, 0, {from:user[1]}))
            .then(() => contract.commitVote(poll1, createVoteHash(arrayVoteOption[2], arraySalts[2]), 75, 0, {from:user[2]}))
            .then(() => contract.commitVote(poll1, createVoteHash(arrayVoteOption[3], arraySalts[3]), 25, 0, {from:user[3]}))
            .then(() => increaseTime(commitDuration + 1))
            
            .then(() => contract.revealVote(poll1, arrayVoteOption[0], arraySalts[0], {from: user[0]})) 
            .catch((err) => assert.equal(re.test(err), true, "Revealing vote that should not been committed"))
            
            .then(() => contract.commitVote(poll1, createVoteHash(arrayVoteOption[0], arraySalts[0]), 10, 0, {from:user[0]}))
            .catch((err) => assert.equal(re.test(err), true, "Committing during reveal period"))
            
            .then(() => contract.revealVote(poll1, arrayVoteOption[1], arraySalts[1], {from: user[1]}))
            // .then(() => contract.hasBeenRevealed.call(poll1, {from: user[1]}))
            // .then((revealed) => console.log("poll1, user[1] revealed: ", revealed))
            
            .then(() => contract.revealVote(poll1, arrayVoteOption[2], arraySalts[2], {from: user[2]})) 
            // .then(() => contract.hasBeenRevealed.call(poll1, {from: user[2]}))
            // .then((revealed) => console.log("poll1, user[2] revealed: ", revealed))
            
            .then(() => contract.revealVote(poll1, arrayVoteOption[3], arraySalts[3], {from: user[3]})) 
            // .then(() => contract.hasBeenRevealed.call(poll1, {from: user[3]}))
            // .then((revealed) => console.log("poll1, user[3] revealed: ", revealed))
            
            .then(() => increaseTime(revealDuration + 1))
            .then(() => contract.isPassed.call(poll1))
            .then((result) => {
                // console.log("poll1 passed:", result)
                assert.equal(result, true, "Poll should have passed but did not")
            });
            assert();
    });

    it("should test multiple votes for single user", () => {
        let contract;

        let arraySalts = [10, 420, 666];

        function catchWithdraw(numTokens, user) {
            return contract.withdrawVotingRights(numTokens, {from: user})
            .then(() => assert.ok(false, "withdraw didn't throw"))
            .catch((err) => assert.equal(re.test(err), true, "withdraw threw incorrectly"))
        }

        return getVoteContract()
            .then((instance) => contract = instance)

            // launch poll 2
            .then(() => launchPoll("Yorke comes in on time", commitDuration, revealDuration))
            .then((pollID) => poll2 = pollID)

            // launch poll 3
            .then(() => launchPoll("Aspyn eats a taco", commitDuration, revealDuration))
            .then((pollID) => poll3 = pollID)

            //launch poll 4
            .then(() => launchPoll("Terry gets less tall", commitDuration, revealDuration))
            .then((pollID) => poll4 = pollID)

            // check if poll4 passed
            .then(() => contract.isPassed.call(poll2))
            .then((passed) => assert.ok(false, "isPassed didn't throw"))
            .catch((err) => assert.equal(re.test(err), true, "isPassed threw incorrectly"))

            // commit a vote to each poll
            .then(() => contract.commitVote(poll2, createVoteHash(1, arraySalts[0]), 5, 0, {from: user[1]}))
            .then(() => contract.commitVote(poll3, createVoteHash(0, arraySalts[1]), 25, poll2, {from: user[1]}))
            .then(() => contract.commitVote(poll4, createVoteHash(1, arraySalts[2]), 51, poll3, {from: user[1]}))

            .then(() => catchWithdraw(51, user[1]))
            .then(() => increaseTime(commitDuration + 1))

            .then(() => catchWithdraw(51, user[1]))
            .then(() => contract.revealVote(poll3, 0, arraySalts[1], {from: user[1]}))
            // .then(() => contract.hasBeenRevealed.call(poll3, {from: user[1]}))
            // .then((revealed) => console.log("poll3, user[1] revealed: ", revealed))

            .then(() => catchWithdraw(51, user[1]))
            .then(() => contract.withdrawVotingRights(49, {from: user[1]})) //committed 51, 100 tokens total
            // .then(() => console.log("withdraw of 49 succeeded"))

            .then(() => contract.revealVote(poll4, 1, arraySalts[2], {from: user[1]}))
            // .then(() => contract.hasBeenRevealed.call(poll4, {from: user[1]}))
            // .then((revealed) => console.log("poll4, user[1] revealed: ", revealed))
            
            .then(() => contract.withdrawVotingRights(46, {from: user[1]})) //withdraw remaining 46 tokens (5 still locked)
            // .then(() => console.log("withdraw of remaining _46_ succeeded"))

            .then(() => contract.isPassed.call(poll3))
            .then((passed) => assert.ok(false, "isPassed didn't throw"))
            .catch((err) => assert.equal(re.test(err), true, "isPassed threw incorrectly"))

            .then(() => increaseTime(revealDuration + 1))
            .then(() => contract.isPassed.call(poll2))
            .then((passed) => assert.equal(passed, false, "poll2 did not pass incorrectly"))

            .then(() => contract.isPassed.call(poll3))
            .then((passed) => assert.equal(passed, false, "poll3 passed incorrectly"))

            .then(() => contract.isPassed.call(poll4))
            .then((passed) => assert.equal(passed, true, "poll4 didn't pass"));
    });

    it("should check user rewards for each poll", () => {
        let arraySalts = [20, 10, 420];

        let contract;
        return getVoteContract()
            .then((instance) => contract = instance)

            // poll 1 rewards
            .then(() => contract.getNumPassingTokens.call(user[0], poll1, arraySalts[0]))
            .then((passing) => assert.ok(false, "getNumPassingTokens didn't throw when user hasn't revealed"))
            .catch((err) => assert.equal(re.test(err), true, "getNumPassingTokens threw incorrectly"))

            .then(() => contract.getNumPassingTokens.call(user[1], poll1, arraySalts[1]))
            .then((result) => assert.equal(Number(result), 100, "User1 poll1 reward incorrect"))
            
            .then(() => contract.getNumPassingTokens.call(user[2], poll1, arraySalts[2]))
            .then((result) => assert.equal(Number(result), 75, "User2 poll1 reward incorrect"))

            // poll 2 rewards
            .then(() => contract.getNumPassingTokens.call(user[1], poll2, arraySalts[1]))
            .then((result) => assert.equal(result, 0, "User1 poll2 reward incorrect"))

            .then(() => contract.getNumPassingTokens.call(user[2], poll2, arraySalts[2]))
            .then((passing) => assert.ok(false, "getNumPassingTokens didn't throw when user hasn't revealed"))
            .catch((err) => assert.equal(re.test(err), true, "getNumPassingTokens threw incorrectly"))

            // poll 3 rewards
            .then(() => contract.getNumPassingTokens.call(user[1], poll3, arraySalts[1]))
            .then((result) => assert.equal(result, 0, "User1 poll3 reward incorrect"))
            
            .then(() => contract.getNumPassingTokens.call(user[2], poll3, arraySalts[2]))
            .then((passing) => assert.ok(false, "getNumPassingTokens didn't throw when user hasn't revealed"))
            .catch((err) => assert.equal(re.test(err), true, "getNumPassingTokens threw incorrectly"));
    });
});
