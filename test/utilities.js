var BN = require('bn.js');
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
        .then((block) => block.timestamp.toString(10));
    }

    function increaseTime(seconds) {
        return new Promise((resolve, reject) => { 
            return ethRPC.sendAsync({
                method: 'evm_increaseTime',
                params: [seconds]
            }, (err) => {
                if (err) reject(err)
                resolve()
            })
        })
        .then(() => {
            return new Promise((resolve, reject) => { 
                return ethRPC.sendAsync({
                    method: 'evm_mine',
                    params: []
                }, (err) => {
                    if (err) reject(err)
                    resolve()
                })
            })
        })
    }

    // commitDuration is a base 10 string
    // getBlockTimestamp is also a base 10 string
    // getPoll also returns everything as base10 string
    
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
        .then((num) => commitDuration = new BN(String(num), 10))
        .then(() => launchPoll('commit poll'))
        .then((num) => pollID = num)
        .then(() => getBlockTimestamp())
        .then((time) => timestamp = new BN(time, 10))
        .then(() => getPoll(pollID))
        .then((poll) => commitEndDate = poll[0])
        .then(() => assert.equal(commitEndDate, timestamp.add(commitDuration).toString(10), "poll commit end date wrong"));
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
        .then((dur) => commitDuration = new BN(String(dur), 10))
        .then(() => contract.revealDuration.call())
        .then((dur) => revealDuration = new BN(String(dur), 10))
        .then(() => launchPoll('reveal poll'))
        .then((num) => pollID = num)
        .then(() => getBlockTimestamp())
        .then((time) => timestamp = new BN(time, 10))
        .then(() => getPoll(pollID))
        .then((poll) => revealEndDate = poll[1])
        .then(() => assert.equal(revealEndDate, timestamp.add(commitDuration).add(revealDuration).toString(10), "poll reveal end date wrong")); 
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


    it("check if commit period correctly active", function() {
        // Check commit period active, reveal period inactive, poll not ended
        let pollIDinstance;
        return launchPoll("commit period test")
        .then((pollID) => {
            pollIDinstance = pollID; 
            return getVoteContract();
        })
        .then((vote) => vote.commitPeriodActive.call(pollIDinstance))
        .then((result) => assert.equal(result, true, "Poll wasn't active"));
    });


    it("check if reveal period correctly active", function() {
        // Check commit period inactive, reveal period active
        let pollID;
        let contract;
        return launchPoll("reveal period test") 
        .then((id) => pollID = id)
        .then(() => getVoteContract())
        .then((instance) => contract = instance)
        .then(() => contract.commitDuration.call())
        .then((dur) => increaseTime(Number(dur)))
        .then(() => getVoteContract())
        .then((instance) => contract.revealPeriodActive.call(pollID))
        .then((result) => assert.equal(result, true, "Poll wasn't in reveal"));
    });

    /*
    ***Test this modifier through functionality***
    it("check if poll ended", function() {
        // Check commit inactive, reveal inactive, poll ended
        let pollID;
        let contract;
        return launchPoll("poll end test") 
        .then((id) => pollID = id)
        .then(() => increaseTime(210))
        .then(() => getVoteContract())
        .then((instance) => instance.pollEnded.call(pollID))
        .then((result) => assert.equal(result, true, "Poll had not ended"));
    });
    */

    it("trusted users are correct", function() {
        // Check if the trusted users are correct
        return PLCRVoting.deployed()
        .then(function(instance) {

        })
    });

    it("valid poll IDs when in commit period", function() {
        // Check if the started polls in the commit period are valid,
        let pollID;
        let contract;
        return launchPoll("valid poll ID test in commit") 
        .then((id) => pollID = id)
        .then(() => getVoteContract())
        .then((instance) => instance.validPollID.call(pollID))
        .then((result) => assert.equal(result, true, "Poll isn't valid in commit period"));
    });

    it("valid poll IDs when in reveal period", function() {
        // Check if the started polls in the reveal period are valid,
        let pollID;
        let contract;
        return launchPoll("reveal period test") 
        .then((id) => pollID = id)
        .then(() => getVoteContract())
        .then((instance) => contract = instance)
        .then(() => contract.commitDuration.call())
        .then((dur) => increaseTime(Number(dur)))
        .then(() => contract.revealPeriodActive.call(pollID))
        .then((result) => assert.equal(result, true, "Poll wasn't in reveal"))
        .then(() => contract.validPollID.call(pollID))
        .then((result) => assert.equal(result, true, "Poll isn't valid in reveal period"));
    });

    it("valid poll IDs when in ended period", function() {
        // Check if the started polls that have ended are valid,
        let pollID;
        let contract;
        let commitDuration;
        let revealDuration;
        return launchPoll("reveal period test") 
        .then((id) => pollID = id)
        .then(() => getVoteContract())
        .then((instance) => contract = instance)
        .then(() => contract.commitDuration.call())
        .then((dur) => commitDuration = dur)
        .then(() => contract.revealDuration.call())
        .then((dur) => revealDuration = dur)
        .then(() => increaseTime(Number(commitDuration) + Number(revealDuration)))
        .then(() => contract.validPollID.call(pollID))
        .then((result) => assert.equal(result, true, "Poll isn't valid in reveal period"));
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
