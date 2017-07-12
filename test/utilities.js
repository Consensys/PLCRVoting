require('./testHelpers.js')();

var BN = require('bn.js');
var fs = require("fs");

const commitDuration = '1000000';
const revealDuration = '1000000';

// regular expression to check for invalid opcode error
const re = new RegExp("(invalid opcode)","i");

contract('Utilities Testing', function(accounts) {
    // Check for non-existence of the single poll
    // and then the existence of the poll and then that the poll
    // is in commit phase
    const [owner, user1, user2, user3, user4, user5, user6, user7, user8, user9] = accounts;

    const utilConf = JSON.parse(fs.readFileSync("./conf/testUtilities.json"));

    var trustedAccounts = [];
    utilConf.trustedAccounts.forEach((idx) => trustedAccounts.push(accounts[idx]));

    it("should check if a non-owner can start a poll", () => {
        return getVoteContract()
            .then((instance) => instance.startPoll('', 50, commitDuration, revealDuration, {from: accounts[1]}))
            .catch((err) => assert.equal(re.test(err), true, "Expected error not found"));
    });

    it("should check proposal string from start poll event", function() {
        const propStr = "first poll";
        let contract;
        return getVoteContract()
            .then((instance) => contract = instance)
            .then(() => contract.startPoll(propStr, 50, commitDuration, revealDuration))
            .then((result) => result.logs[0].args.pollID.toString())
            .then((pollID) => getPoll(pollID))
            .then((pollArr) => assert.equal(pollArr[0], propStr, "poll created incorrectly"))
    });

/*
    it("should check getProposalString function", function() {
        const propStr = "my poll";
        let contract;
        return getVoteContract()
            .then((instance) => contract = instance)
            .then(() => contract.startPoll(propStr, 50, commitDuration, revealDuration))
            .then((result) => result.logs[0].args.pollID.toString())
            .then((pollID) => contract.getProposalString.call(pollID))
            .then((result) => assert.equal(result, propStr, "getProposalString function incorrect"))
    
    });
*/

    it("should check commit end date", function() {
        let contract;
        let pollID;
        let commitEndDate;
        let timestamp;
        return getVoteContract()
            .then((instance) => contract = instance)
            .then(() => launchPoll('commit poll', commitDuration, revealDuration))
            .then((num) => pollID = num)
            .then(() => getBlockTimestamp())
            .then((time) => timestamp = new BN(time, 10))
            .then(() => getPoll(pollID))
            .then((poll) => commitEndDate = poll[1])
            .then(() => assert.equal(commitEndDate, timestamp.add((new BN(commitDuration,10))).toString(10), "poll commit end date wrong"));
    });

    it("should check reveal end date", function() {
        let contract;
        let pollID;
        let revealEndDate;
        let timestamp;
        return getVoteContract()
            .then((instance) => contract = instance)
            .then(() => launchPoll('reveal poll', commitDuration, revealDuration))
            .then((num) => pollID = num)
            .then(() => getBlockTimestamp())
            .then((time) => timestamp = new BN(time, 10))
            .then(() => getPoll(pollID))
            .then((poll) => revealEndDate = poll[2])
            .then(() => assert.equal(revealEndDate, timestamp.add((new BN(commitDuration,10))).add((new BN(revealDuration,10))).toString(10), "poll reveal end date wrong")); 
    });


    it("should start three polls", function() {
        // Check for existence of the three polls and that they 
        // are in commit phase   
        let contract;
        const propStr = "poll";

        return launchPoll(1+propStr, commitDuration, revealDuration)
            .then((pollID) => getPoll(pollID))
            .then((pollArr) => assert.equal(pollArr[0], 1+propStr, "poll created incorrectly"))
            .then(() => launchPoll(2+propStr, commitDuration, revealDuration))
            .then((pollID) => getPoll(pollID))
            .then((pollArr) => assert.equal(pollArr[0], 2+propStr, "poll created incorrectly"))
            .then(() => launchPoll(3+propStr, commitDuration, revealDuration))
            .then((pollID) => getPoll(pollID))
            .then((pollArr) => assert.equal(pollArr[0], 3+propStr, "poll created incorrectly"));
    });


    it("should check if commit period correctly active", function() {
        // Check commit period active, reveal period inactive, poll not ended
        let pollIDinstance;
        return launchPoll("commit period test", commitDuration, revealDuration)
            .then((pollID) => {
                pollIDinstance = pollID; 
                return getVoteContract();
            })
            .then((vote) => vote.commitPeriodActive.call(pollIDinstance))
            .then((result) => assert.equal(result, true, "Poll wasn't active"));
    });


    it("should check if reveal period correctly active", function() {
        // Check commit period inactive, reveal period active
        let pollID;
        let contract;
        return launchPoll("reveal period test", commitDuration, revealDuration) 
            .then((id) => pollID = id)
            .then(() => getVoteContract())
            .then((instance) => contract = instance)
            .then((dur) => increaseTime(Number(commitDuration)+1))
            .then(() => contract.pollMap.call(pollID))
            .then(() => contract.revealPeriodActive.call(pollID))
            .then((result) => assert.equal(result, true, "Poll wasn't in reveal"));
    });

    /*
     ***Test this modifier through functionality***
    it("should check if poll ended", function() {
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

/*
    it("should have valid poll IDs when in commit period", function() {
        // Check if the started polls in the commit period are valid,
        let pollID;
        let contract;
        return launchPoll("valid poll ID test in commit", commitDuration, revealDuration) 
            .then((id) => pollID = id)
            .then(() => getVoteContract())
            .then((instance) => instance.validPollID.call(pollID))
            .then((result) => assert.equal(result, true, "Poll isn't valid in commit period"));
    });

    it("should have valid poll IDs when in reveal period", function() {
        // Check if the started polls in the reveal period are valid,
        let pollID;
        let contract;
        return launchPoll("reveal period test", commitDuration, revealDuration) 
            .then((id) => pollID = id)
            .then(() => getVoteContract())
            .then((instance) => contract = instance)
            .then((dur) => increaseTime(Number(commitDuration)+1))
            .then(() => contract.revealPeriodActive.call(pollID))
            .then((result) => assert.equal(result, true, "Poll wasn't in reveal"))
            .then(() => contract.validPollID.call(pollID))
            .then((result) => assert.equal(result, true, "Poll isn't valid in reveal period"));
    });

    it("should have valid poll IDs when in ended period", function() {
        // Check if the started polls that have ended are valid,
        let pollID;
        let contract;
        return launchPoll("reveal period test", commitDuration, revealDuration) 
            .then((id) => pollID = id)
            .then(() => getVoteContract())
            .then((instance) => contract = instance)
            .then(() => increaseTime(Number(commitDuration) + Number(revealDuration) + 1))
            .then(() => contract.validPollID.call(pollID))
            .then((result) => assert.equal(result, true, "Poll isn't valid in reveal period"));
    });
*/
    it("should non-revealed poll pass", () => {
        let pollID;
        let contract;
        return launchPoll("reveal period test", commitDuration, revealDuration) 
            .then((id) => pollID = id)
            .then(() => getVoteContract())
            .then((instance) => contract = instance)
            .then(() => increaseTime(Number(commitDuration) + Number(revealDuration) + 1))
            .then(() => contract.isPassed.call(pollID))
            .then((result) => assert.equal(result, true, "non-voted poll does not pass"));
    });

    it("should poll with more revealed voting for proposal does pass", () => {
        let pollID;
        let contract;
        let salt = 1;
        let voteOption = 1;
        let voteHash = createVoteHash(voteOption, salt);
        return launchPoll("reveal period test", commitDuration, revealDuration) 
            .then((id) => pollID = id)
            .then(() => getVoteContract())
            .then((instance) => contract = instance)
            .then(() => contract.loadTokens(10, {from: accounts[1]}))
            .then(() => contract.commitVote(pollID, voteHash, 10, 0, {from:accounts[1]}))
            .then(() => increaseTime(Number(commitDuration) + 1))
            .then(() => contract.revealVote(pollID, salt, voteOption, {from: accounts[1]}))
            .then(() => increaseTime(Number(revealDuration) + 1))
            .then(() => contract.isPassed.call(pollID))
            .then((result) => assert.equal(result, true, "once voted for poll does not pass"));
    });

    it("should poll with more revealed voting against proposal does not pass", () => {
        let pollID;
        let contract;
        let salt = 1;
        let voteOption = 0;
        let voteHash = createVoteHash(voteOption, salt);
        return launchPoll("reveal period test", commitDuration, revealDuration) 
            .then((id) => pollID = id)
            .then(() => getVoteContract())
            .then((instance) => contract = instance)
            .then(() => contract.loadTokens(10, {from: accounts[1]}))
            .then(() => contract.commitVote(pollID, voteHash, 10, 0, {from:accounts[1]}))
            .then(() => increaseTime(Number(commitDuration) + 1))
            .then(() => contract.revealVote(pollID, salt, voteOption, {from: accounts[1]}))
            .then(() => increaseTime(Number(revealDuration) + 1))
            .then(() => contract.isPassed.call(pollID))
            .then((result) => assert.equal(result, false, "once voted against poll does pass"));
    });

    it("should check if poll with multiple more revealed votes for proposal does pass", () => {
        let pollID;
        let contract;

        let saltUser1 = 1;
        let voteOptionUser1 = 1;
        let voteHashUser1 = createVoteHash(voteOptionUser1, saltUser1);
        
        let saltUser2 = 2;
        let voteOptionUser2 = 0;
        let voteHashUser2 = createVoteHash(voteOptionUser2, saltUser2);

        let saltUser3 = 3;
        let voteOptionUser3 = 0;
        let voteHashUser3 = createVoteHash(voteOptionUser3, saltUser3);

        return launchPoll("reveal period test", commitDuration, revealDuration) 
            .then((id) => pollID = id)
            .then(() => getVoteContract())
            .then((instance) => contract = instance)

            // load tokens for users
            .then(() => contract.loadTokens(70, {from: accounts[1]}))
            .then(() => contract.loadTokens(20, {from: accounts[2]}))
            .then(() => contract.loadTokens(10, {from: accounts[3]}))

            // commitVote for multiple users
            .then(() => contract.commitVote(pollID, voteHashUser1, 70, 0, {from:accounts[1]}))
            .then(() => contract.commitVote(pollID, voteHashUser2, 20, 0, {from:accounts[2]}))
            .then(() => contract.commitVote(pollID, voteHashUser3, 10, 0, {from:accounts[3]}))

            // get time to reveal period
            .then(() => increaseTime(Number(commitDuration) + 1))

            // reveal vote for multiple users
            .then(() => contract.revealVote(pollID, saltUser1, voteOptionUser1, {from: accounts[1]}))
            .then(() => contract.revealVote(pollID, saltUser2, voteOptionUser2, {from: accounts[2]}))
            .then(() => contract.revealVote(pollID, saltUser3, voteOptionUser3, {from: accounts[3]}))

            .then(() => increaseTime(Number(revealDuration) + 1))
            .then(() => contract.isPassed.call(pollID))
            .then((result) => assert.equal(result, true, "poll with more votes revealed for does not pass"));
    });

    it("should check if getNumPassingTokens returns correct number of passing tokens", () => {
        let pollID;
        let contract;

        let saltUser1 = 1;
        let voteOptionUser1 = 1;
        let voteHashUser1 = createVoteHash(voteOptionUser1, saltUser1);
        
        let saltUser2 = 2;
        let voteOptionUser2 = 0;
        let voteHashUser2 = createVoteHash(voteOptionUser2, saltUser2);

        let saltUser3 = 3;
        let voteOptionUser3 = 0;
        let voteHashUser3 = createVoteHash(voteOptionUser3, saltUser3);

        let correctVote = 30;

        return launchPoll("getNumCorrectVote test", commitDuration, revealDuration) 
            .then((id) => pollID = id)
            .then(() => getVoteContract())
            .then((instance) => contract = instance)

            // load tokens for users
            .then(() => contract.loadTokens(30, {from: accounts[4]}))
            .then(() => contract.loadTokens(10, {from: accounts[2]}))
            .then(() => contract.loadTokens(5, {from: accounts[3]}))

            // commitVote for multiple users
            .then(() => contract.commitVote(pollID, voteHashUser1, correctVote, 0, {from:accounts[4]}))
            .then(() => contract.commitVote(pollID, voteHashUser2, 10, 0, {from:accounts[2]}))
            .then(() => contract.commitVote(pollID, voteHashUser3, 5, 0, {from:accounts[3]}))

            // get time to reveal period
            .then(() => increaseTime(Number(commitDuration) + 1))

            // reveal vote for multiple users
            .then(() => contract.revealVote(pollID, saltUser1, voteOptionUser1, {from: accounts[4]}))
            .then(() => contract.revealVote(pollID, saltUser2, voteOptionUser2, {from: accounts[2]}))
            .then(() => contract.revealVote(pollID, saltUser3, voteOptionUser3, {from: accounts[3]}))
            .then(() => increaseTime(Number(revealDuration) + 1))
            .then(() => contract.getNumPassingTokens.call(pollID, saltUser1, {from: accounts[4]}))
            .then((num) => assert.equal(Number(num), correctVote, "getNumCorrectVote returns wrong number"))
        
    });
});
