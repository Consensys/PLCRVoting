var PLCRVoting = artifacts.require("./PLCRVoting.sol");
var HttpProvider = require('ethjs-provider-http');
var EthRPC = require('ethjs-rpc');
var ethRPC = new EthRPC(new HttpProvider('http://localhost:8545'));
var EthQuery = require('ethjs-query');
var ethQuery = new EthQuery(new HttpProvider('http://localhost:8545'));

contract('Utilities', function(accounts) {
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
          
    function getBlockTimestamp() {
        return ethQuery.blockNumber()
        .then((num) => ethQuery.getBlockByNumber(num,true))
        .then((block) => Number(block.timestamp.toNumber(10)));
    }
    it("check proposal string", function() {
        const propStr = "first poll";
        let contract;
        return getVoteContract()
        .then((instance) => contract = instance)
        .then(() => contract.startPoll(propStr, 50))
        .then((result) => result.logs[0].args.pollID.toString())
        .then((pollID) => getPoll(pollID))
        .then((pollArr) => assert.equal(pollArr[5], propStr, "poll created incorrectly"));
    });

    it("check commit end date", function() {
        let contract;
        let pollID;
        let commitEndDate;
        let commitDuration;
        let timestamp;
        return getVoteContract()
        .then((instance) => contract = instance)
        .then(() => contract.commitDuration.call())
        .then((dur) => commitDuration = Number(dur))
        .then(() => launchPoll('commit poll'))
        .then((num) => pollID = num)
        .then(() => getBlockTimestamp())
        .then((time) => timestamp = time)
        .then(() => getPoll(pollID))
        .then((poll) => commitEndDate = poll[0])
        .then(() => assert.equal(commitEndDate, timestamp + commitDuration, "poll time fucked"));
    });

    it("check reveal end date", function() {
        let contract;
        let pollID;
        let revealEndDate;
        let commitDuration;
        let revealDuration;
        let timestamp;
        return getVoteContract()
        .then((instance) => contract = instance)
        .then(() => contract.commitDuration.call())
        .then((dur) => commitDuration = Number(dur))
        .then(() => contract.revealDuration.call())
        .then((dur) => revealDuration = Number(dur))
        .then(() => launchPoll('reveal poll'))
        .then((num) => pollID = num)
        .then(() => getBlockTimestamp())
        .then((time) => timestamp = time)
        .then(() => getPoll(pollID))
        .then((poll) => revealEndDate = poll[1])
        .then(() => assert.equal(revealEndDate, timestamp + commitDuration+ revealDuration, "poll time fucked")); 
    });


    it("start three polls", function() {
        // Check for existence of the three polls and that they 
        // are in commit phase   
        let contract;
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
        return launchPoll("commitTesterevealrPoll")
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
