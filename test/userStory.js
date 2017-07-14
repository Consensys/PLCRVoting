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
});
