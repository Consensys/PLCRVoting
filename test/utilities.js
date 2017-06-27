var PLCRVoting = artifacts.require("./PLCRVoting.sol");

contract('Voting', function(accounts) {
    // Check for non-existence of the single poll
    // and then the existence of the poll and then that the poll
    // is in commit phase

    function getVoteContract() {
        return PLCRVoting.deployed();
    }

    function launchPoll(proposal) {
        return getVoteContract()
        .then((vote) => vote.startPoll(proposal, 50))
        .then((result) => result.logs[0].args.pollID.toString());
    }

    function getPoll(pollID) {
        return getVoteContract()
        .then((instance) => instance.pollMap.call(pollID));
    }

          // pollIDinstance = pollID;
          //   assert.equal(pollID, i, "poll ID should have been " + i);
          // .then((poll) => {
          //   assert.equal(50 + i, poll[2], "vote quota incorrect");
          //   assert.equal("prop" + i, poll[5], "proposal incorrect");
          // })
          // .then(() => pollIDinstance);

    it("start single poll", function() {
        const propStr = "first poll";
        return launchPoll(propStr)
        .then((pollID) => getPoll(pollID))
        .then((pollArr) => assert.equal(pollArr[5], propStr, "poll created incorrectly"));
    });

    it("start three polls", function() {
        // Check for existence of the three polls and that they 
        // are in commit phase   
        const propStr = "poll";

        return launchPoll(1+propStr)
        .then((pollID) => getPoll(pollID))
        .then((pollArr) => assert.equal(pollArr[5], 1+propStr, "poll created incorrectly"))
        .then(() => launchPoll(2+propStr))
        .then((pollID) => getPoll(pollID))
        .then((pollArr) => assert.equal(pollArr[5], 2+propStr, "poll created incorrectly"))
        .then(() => launchPoll(3+propStr))
        .then((pollID) => getPoll(pollID))
        .then((pollArr) => assert.equal(pollArr[5], 3+propStr, "poll created incorrectly"));
    });


    it("commit period correctly active", function() {
        // Check commit period active, reveal period inactive, poll not ended
        let pollIDinstance;
        return launchPoll("commitTesterPoll")
        .then((pollID) => {
            pollIDinstance = pollID; 
            return getVoteContract();
        })
        .then((vote) => vote.commitPeriodActive.call(pollIDinstance))
        .then((result) => assert.equal(result, true, "Poll wasn't active"));
    });


    it("reveal period correctly active", function() {
        // Check commit period inactive, reveal period active
        return PLCRVoting.deployed()
        .then(function(instance) {

        })
    });

    it("poll ended", function() {
        // Check commit inactive, reveal inactive, poll ended
        return PLCRVoting.deployed()
        .then(function(instance) {

        })
    });

    it("trusted users are correct", function() {
        // Check if the trusted users are correct
        return PLCRVoting.deployed()
        .then(function(instance) {

        })
    });

    it("valid poll IDs when in commit period", function() {
        // Check if the started polls in the commit period are valid,
        return PLCRVoting.deployed()
        .then(function(instance) {

        })
    });

    it("valid poll IDs when in reveal period", function() {
        // Check if the started polls in the reveal period are valid,
        return PLCRVoting.deployed()
        .then(function(instance) {

        })
    });

    it("valid poll IDs when in ended period", function() {
        // Check if the started polls that have ended are valid,
        return PLCRVoting.deployed()
        .then(function(instance) {

        })
    });

    it("set commit duration", function() {
        // Check if setting the commit duration updates said variable
        return PLCRVoting.deployed()
        .then(function(instance) {

        })
    });

    it("set reveal duration", function() {
        // Check if setting the reveal duration updates said variable
        return PLCRVoting.deployed()
        .then(function(instance) {

        })
    });

    it("set vote quota", function() {
        // Check if setting the vote quota updates said variable
        return PLCRVoting.deployed()
        .then(function(instance) {

        })
    });
});
