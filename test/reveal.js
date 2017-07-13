require('./testHelpers.js')();

function pollComparison(user, pollID, expected) {
    let voter;
    return PLCRVoting.deployed()
        .then((instance) => {
            voter = instance; 
            return voter.pollMap.call(pollID, {from: user});
        })
        .then((results) => 
                {
                    let votesFor = results[4].toString();
                    let votesAgainst = results[5].toString();
                    assert.equal(expected.votesFor, votesFor, "votesFor incorrect");
                    assert.equal(expected.votesAgainst, votesAgainst, "votesAgainst incorrect");
                }
            );           
}                

function checkDeletion(user, pollID) {
    let voter;
    return PLCRVoting.deployed()
        .then((instance) => {
            voter = instance; 
            return voter.voteMap.call(createIndexHash(user, pollID, "prevID"));
        })
        .then((prevID) => {
            assert.equal(prevID, pollID, "prevID not equal to pollID -> node deletion failed");
            return voter.voteMap.call(createIndexHash(user, pollID, "nextID"));
        })
        .then((nextID) => {
            assert.equal(nextID, pollID, "nextID not equal to pollID -> node deletion failed");
        });
}                

function increaseTime(seconds) {
  return new Promise(function(resolve, reject){
    web3.currentProvider.sendAsync(
      {
        jsonrpc: "2.0",
        method: "evm_increaseTime",
        params: [seconds],
        id: 0
      },
      resolve
    );
  });
}

contract('Reveal Testing', function(accounts) {
    require('./testConf')(accounts);
    function startPolls(numOfPolls) {
        var ids = [];
        var promises = [];
        
        return new Promise(function (resolve, reject) {
            PLCRVoting.deployed()
            .then(function (instance) {
                for (var i = 0; i < numOfPolls; i++) {
                    promises.push(instance.startPoll("", 50, commitDuration, revealDuration)
                        .then((result) => {
                            ids.push(result.logs[0].args.pollID.toString());
                        }));
                }
                Promise.all(promises).then(() => resolve(ids));
            });
        });
    }

 
    
    it("should single reveal for single commit to single poll", function() {
        var expected = {
            votesFor: 10,
            votesAgainst: 0
        };

        let instance;
        let pollId;
        var hash = createVoteHash(1, 100);
        return PLCRVoting.deployed()
        .then((_instance) => instance = _instance)
        .then(() => instance.requestVotingRights(10, {from: user[0]}))
        .then(() => startPolls(1))
        .then((pollIds) => pollId = pollIds[0])
        .then(() => instance.commitVote(pollId, hash, 10, 0, {from: user[0]}))
        .then(() => getBlockTimestamp())
        .then(() => increaseTime(1000001))
        .then(() => getBlockTimestamp())
        .then(() => instance.revealVote(pollId, 100, 1, {from: user[0]}))
        .then(() => getBlockTimestamp())
        .then(() => pollComparison(user[0], pollId, expected))
        .then(() => checkDeletion(user[0], pollId))
        .then(() => instance.hasBeenRevealed.call(pollId, {from: user[0]}))
        .then((result) => assert.equal(true, result, "node should have been revealed"));
    });

    it("should attempt double reveal (by single sender) for single commit to single poll", function() {
        var expected = {
            votesFor: 10,
            votesAgainst: 0
        };

        let instance;
        let pollId;
        var hash = createVoteHash(1, 100);
        return PLCRVoting.deployed()
        .then((_instance) => instance = _instance)
        .then(() => instance.requestVotingRights(10, {from: user[0]}))
        .then(() => startPolls(1))
        .then((pollIds) => pollId = pollIds[0])
        .then(() => instance.commitVote(pollId, hash, 10, 0, {from: user[0]}))
        .then(() => increaseTime(1000001))
        .then(() => instance.revealPeriodActive.call(pollId))
        .then(() => instance.revealVote(pollId, 100, 1, {from: user[0]}))
        .then(() => pollComparison(user[0], pollId, expected))
        .then(() => checkDeletion(user[0], pollId))
        .then(() => instance.hasBeenRevealed.call(pollId, {from: user[0]}))
        .then((result) => assert.equal(true, result, "node should have been revealed"))
        .then(() => instance.revealVote(pollId, 100, 1, {from: user[0]}))
        .catch((err) => assert.equal(re.test(err), true, "Expected error not found"))
        .then(() => instance.hasBeenRevealed.call(pollId, {from: user[0]}))
        .then((result) => assert.equal(true, result, "Why is node not revealed?"))
        .then(() => pollComparison(user[0], pollId, expected)) // Make sure results of poll have not changed after calling reveal twice
    });

    it("should attempt single reveal different vote than committed vote to single poll", function() {
        var expected = {
            votesFor: 0,
            votesAgainst: 0
        };

        let pollId;
        var hash = createVoteHash(1, 100);
        let instance;
        return PLCRVoting.deployed()
        .then((_instance) => instance = _instance)
        .then(() => instance.requestVotingRights(10, {from: user[1]}))
        .then(() => startPolls(1))
        .then((pollIds) => pollId = pollIds[0])
        .then(() => instance.commitVote(pollId, hash, 10, 0, {from: user[1]}))
        .then(() => increaseTime(1000001))
        .then(() => instance.revealVote(pollId, 100, 0, {from: user[1]}))
        .then(() => pollComparison(user[1], pollId, expected))
        .then(() => instance.hasBeenRevealed.call(pollId, {from: user[1]}))
        .then((result) => assert.equal(false, result, "node should not have been revealed"));
    });

    it("should attempt single reveal for no commit to single poll", function() {

        var expected = {
            votesFor: 0,
            votesAgainst: 0
        };

        let pollId;
        var hash = createVoteHash(1, 100);
        let instance;

        return PLCRVoting.deployed() 
        .then((_instance) => instance = _instance)
        .then(() => instance.requestVotingRights(50, {from: user[0]}))
        .then(() => startPolls(1))
        .then((pollIds) => pollId = pollIds[0])
        .then(() => increaseTime(1000001))
        .then(() => instance.revealVote(pollId, 100, 1, {from: user[0]}))
        .then(() => pollComparison(user[0], pollId, expected))
        .then(() => instance.hasBeenRevealed.call(pollId, {from: user[0]}))
        .then((result) => assert.equal(false, result, "node should not have been revealed"));
    });

    it("should do three reveals for three commits (different senders) to single poll", function() {
        var expected1 = {
            votesFor: 10,
            votesAgainst: 0
          };
        var expected2 = {
            votesFor: 10,
            votesAgainst: 11
        };
        var expected3 = {
            votesFor: 22,
            votesAgainst: 11
        };

        let pollId;
        let instance;
        var hash1 = createVoteHash(1, 100);
        var hash2 = createVoteHash(0, 50);
        var hash3 = createVoteHash(1, 10);

        return PLCRVoting.deployed() 
        .then((_instance) => instance = _instance)
        .then(() => instance.requestVotingRights(20, {from: user[1]}))
        .then(() => instance.requestVotingRights(20, {from: user[2]}))
        .then(() => instance.requestVotingRights(20, {from: user[3]}))
        .then(() => startPolls(1))
        .then((pollIds) => pollId = pollIds[0])
        .then(() => instance.commitVote(pollId, hash1, 10, 0, {from: user[1]}))
        .then(() => instance.commitVote(pollId, hash2, 11, 0, {from: user[2]}))
        .then(() => instance.commitVote(pollId, hash3, 12, 0, {from: user[3]}))
        .then(() => increaseTime(1000001))
        .then(() => instance.revealVote(pollId, 100, 1, {from: user[1]}))
        .then(() => pollComparison(user[1], pollId, expected1))
        .then(() => checkDeletion(user[1], pollId))
        .then(() => instance.hasBeenRevealed.call(pollId, {from: user[1]}))
        .then((result) => assert.equal(true, result, "user[1] node should have been revealed"))
        .then(() => instance.hasBeenRevealed.call(pollId, {from: user[2]}))
        .then((result) => assert.equal(false, result, "user[2] node should not have been revealed yet"))
         .then(() => instance.hasBeenRevealed.call(pollId, {from: user[3]}))
        .then((result) => assert.equal(false, result, "user[3] node should not have been revealed yet"))
        .then(() => instance.revealVote(pollId, 50, 0, {from: user[2]}))
        .then(() => pollComparison(user[2], pollId, expected2))
        .then(() => checkDeletion(user[2], pollId))
        .then(() => instance.hasBeenRevealed.call(pollId, {from: user[2]}))
        .then((result) => assert.equal(true, result, "user[2] node should have been revealed"))
        .then(() => instance.revealVote(pollId, 10, 1, {from: user[3]}))
        .then(() => pollComparison(user[3], pollId, expected3))
        .then(() => checkDeletion(user[3], pollId))
        .then(() => instance.hasBeenRevealed.call(pollId, {from: user[3]}))
        .then((result) => assert.equal(true, result, "user[3] node should have been revealed"))
    });

    it("should do three reveals for three commits (single sender) to three different polls", function() {
        var expected1 = {
            votesFor: 50,
            votesAgainst: 0
          };
        var expected2 = {
            votesFor: 0,
            votesAgainst: 51
        };
        var expected3 = {
            votesFor: 72,
            votesAgainst: 0
        };

        let instance;
        let pollIds;
        var hash1 = createVoteHash(1, 100);
        var hash2 = createVoteHash(0, 50);
        var hash3 = createVoteHash(1, 10);
          
        return PLCRVoting.deployed()
        .then((_instance) => instance = _instance)
        .then(() => instance.requestVotingRights(100, {from: user[4]}))
        .then(() => startPolls(3))
        .then((_pollIds) => pollIds = _pollIds)
        .then(() => instance.commitVote(pollIds[0], hash1, 50, 0, {from: user[4]}))
        .then(() => instance.getCommitHash(pollIds[0], {from: user[4]}))
        .then(() => instance.commitVote(pollIds[1], hash2, 51, pollIds[0], {from: user[4]}))
        .then(() => instance.commitVote(pollIds[2], hash3, 72, pollIds[1], {from: user[4]}))
        .then(() => increaseTime(1000001))
        .then(() => instance.revealVote(pollIds[0], 100, 1, {from: user[4]}))
        .then(() => pollComparison(user[4], pollIds[0], expected1))
        .then(() => checkDeletion(user[4], pollIds[0]))
        .then(() => instance.hasBeenRevealed.call(pollIds[0], {from: user[4]}))
        .then((result) => assert.equal(true, result, "pollIds[0] node should have been revealed"))
        .then(() => instance.hasBeenRevealed.call(pollIds[1], {from: user[4]}))
        .then((result) => assert.equal(false, result, "pollIds[1] node should not have been revealed yet"))
         .then(() => instance.hasBeenRevealed.call(pollIds[2], {from: user[4]}))
        .then((result) => assert.equal(false, result, "pollIds[2] node should not have been revealed yet"))
        .then(() => instance.revealVote(pollIds[1], 50, 0, {from: user[4]}))
        .then(() => instance.getCommitHash.call(pollIds[2], {from: user[4]}))
        .then(() => pollComparison(user[4], pollIds[1], expected2))
        .then(() => checkDeletion(user[4], pollIds[1]))
        .then(() => instance.hasBeenRevealed.call(pollIds[1], {from: user[4]}))
        .then((result) => assert.equal(true, result, "pollIds[1] node should have been revealed"))
        .then(() => instance.hasBeenRevealed.call(pollIds[0], {from: user[4]}))
        .then((result) => assert.equal(true, result, "pollIds[0] node should have been revealed"))
        .then(() => instance.hasBeenRevealed.call(pollIds[2], {from: user[4]}))
        .then((result) => assert.equal(false, result, "pollIds[1] node should not have been revealed"))
        .then(() => instance.revealVote(pollIds[2], 10, 1, {from: user[4]}))
        .then(() => pollComparison(user[4], pollIds[2], expected3))
        .then(() => checkDeletion(user[4], pollIds[2]))
        .then(() => instance.hasBeenRevealed.call(pollIds[2], {from: user[4]}))
        .then((result) => assert.equal(true, result, "pollIds[2] node should have been revealed"))
    });

    it("should attempt single reveal after reveal expiration date", function() {
        var expected = {
            votesFor: 0,
            votesAgainst: 0
        };

        let instance;
        let pollId;
        var hash = createVoteHash(1, 100);
        return PLCRVoting.deployed()
        .then((_instance) => instance = _instance)
        .then(() => instance.requestVotingRights(10, {from: user[0]}))
        .then(() => startPolls(1))
        .then((pollIds) => pollId = pollIds[0])
        .then(() => instance.commitVote(pollId, hash, 10, 0, {from: user[0]}))
        .then(() => increaseTime(2000001))
        .then(() => instance.revealVote(pollId, 100, 1, {from: user[0]}))
        .catch((err) => assert.equal(re.test(err), true, "Expected error not found"))
        .then(() => pollComparison(user[0], pollId, expected))
        .then(() => instance.hasBeenRevealed.call(pollId, {from: user[0]}))
        .then((result) => assert.equal(false, result, "node should not have been revealed"));
    });
});
