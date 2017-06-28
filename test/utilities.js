var BN = require('bn.js');
var PLCRVoting = artifacts.require("./PLCRVoting.sol");
var HttpProvider = require('ethjs-provider-http');
var EthRPC = require('ethjs-rpc');
var ethRPC = new EthRPC(new HttpProvider('http://localhost:8545'));
var EthQuery = require('ethjs-query');
var ethQuery = new EthQuery(new HttpProvider('http://localhost:8545'));
var fs = require("fs");

contract('Utilities', function(accounts) {
    // Check for non-existence of the single poll
    // and then the existence of the poll and then that the poll
    // is in commit phase
    const [owner, user1, user2, user3, user4, user5, user6] = accounts;

    const utilConf = JSON.parse(fs.readFileSync("./conf/testUtilities.json"));

    var trustedAccounts = [];
    utilConf.trustedAccounts.forEach((idx) => trustedAccounts.push(accounts[idx]));

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
        .then((vote) => {
            accounts.forEach((account) => {
                var isTrustedAccount = trustedAccounts.includes(account);

                return vote.isTrusted.call(account)
                .then((trustVal) => assert.equal(
                    trustVal, isTrustedAccount, "Trusted map was incorrect"
                ));
            });
        });
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

    it("should allow trusted user1 to update commit duration to 1000s", () => {
        // Check if setting the commit duration updates said variable
        let vote;

        return getVoteContract()
        .then((voteInstance) => vote = voteInstance)
        .then(() => vote.setCommitDuration(1000, {from: user1}))
        .then(() => vote.commitDuration.call())
        .then((duration) => assert.equal(duration, 1000, "Commit duration was not updated correctly"));
    });

    it("should not allow untrusted user5 to set commit duration to 420s", () => {
        let vote;

        return getVoteContract()
        .then((voteInstance) => vote = voteInstance)
        .then(() => vote.setCommitDuration(420, {from: user5}))
        .then(() => assert.ok(false, "Commit duration was updated"))
        .catch((err) => vote.commitDuration.call())
        .then((duration) => assert.equal(duration, 1000, "Commit duration was updated incorrectly"));
    });

    it("should allow trusted user2 to update reveal duration to 2000s", () => {
        // Check if setting the commit duration updates said variable
        let vote;

        return getVoteContract()
        .then((voteInstance) => vote = voteInstance)
        .then(() => vote.setRevealDuration(2000, {from: user2}))
        .then(() => vote.revealDuration.call())
        .then((duration) => assert.equal(duration, 2000, "Reveal duration was not updated correctly"));
    });

    it("should not allow untrusted user6 to set commit duration to 420s", () => {
        let vote;

        return getVoteContract()
        .then((voteInstance) => vote = voteInstance)
        .then(() => vote.setRevealDuration(420, {from: user6}))
        .then(() => assert.ok(false, "Reveal duration was updated"))
        .catch((err) => vote.revealDuration.call())
        .then((duration) => assert.equal(duration, 2000, "Reveal duration was updated incorrectly"));
    });

     it("should allow trusted user3 to update voteQuota pct to 75", () => {
        // Check if setting the commit duration updates said variable
        let vote;

        return getVoteContract()
        .then((voteInstance) => vote = voteInstance)
        .then(() => vote.setVoteQuota(75, {from: user3}))
        .then(() => vote.voteQuota.call())
        .then((quota) => assert.equal(quota, 75, "VoteQuota was not updated correctly"));
    });

    it("should not allow untrusted user7 to update voteQuota pct to 42", () => {
        let vote;

        return getVoteContract()
        .then((voteInstance) => vote = voteInstance)
        .then(() => vote.setVoteQuota(42, {from: user7}))
        .then(() => assert.ok(false, "VoteQuota was updated"))
        .catch((err) => vote.voteQuota.call())
        .then((quota) => assert.equal(quota, 75, "VoteQuota was updated incorrectly"));
    });
});
