var PLCRVoting = artifacts.require("./PLCRVoting.sol");
const abi = require("ethereumjs-abi");
var HttpProvider = require('ethjs-provider-http');
var EthRPC = require('ethjs-rpc');
var ethRPC = new EthRPC(new HttpProvider('http://localhost:8545'));
var EthQuery = require('ethjs-query');
var ethQuery = new EthQuery(new HttpProvider('http://localhost:8545'));

function getBlockTimestamp() {
    return ethQuery.blockNumber()
    .then((num) => ethQuery.getBlockByNumber(num,true))
    .then((block) => block.timestamp.toString(10));
}

// returns the solidity-sha3 output for VoteMap indexing
function createIndexHash(account, pollID, atr) {
    let hash = "0x" + abi.soliditySHA3([ "address", "uint", "string" ],
    [ account, pollID, atr ]).toString('hex'); 
    return hash;                                   
}

// returns the solidity-sha3 output for vote hashing
function createVoteHash(vote, salt) {
    let hash = "0x" + abi.soliditySHA3([ "uint", "uint" ],
    [ vote, salt ]).toString('hex'); 
    return hash;                                   
}

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
//   return new Promise((resolve, reject) => {
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

contract('Voting (Reveal)', function(accounts) {
     function startPolls(numOfPolls, callback) {
        var ids = [];
        var promises = [];
        PLCRVoting.deployed()
        .then(function (instance) {
            for (var i = 0; i < numOfPolls; i++) {
                promises.push(instance.startPoll("", 50)
                    .then((result) => {
                        ids.push(result.logs[0].args.pollId.toString());
                    }));
            }
            Promise.all(promises).then(() => callback(ids));
        });
    }

 
    
  it("single reveal for single commit to single poll", function() {
      var expected = {
        votesFor: 1,
        votesAgainst: 0
      };
    let instance;
    return PLCRVoting.deployed()
    .then((_instance) =>
        {
            instance = _instance;
            instance.loadTokens(10, {from: accounts[1]})
        })
    .then(() => 
        {
            startPolls(1, function (pollIds) {
                var pollId = pollIds[0];
                var hash = createVoteHash(1, 100);
                instance.commitVote(pollId, hash, 10, 0, {from: accounts[1]})
                .then(() => getBlockTimestamp())
                .then((res) => console.log("(Test 1) CURR " + res))
                .then(() => increaseTime(1000001))
                .then(() => getBlockTimestamp())
                .then((res) => console.log("(Test 1) CURR2 " + res))
                .then(() => instance.revealVote(pollId, 100, 1, {from: accounts[1]}))
                .then(() => getBlockTimestamp())
                .then((res) => console.log("(Test 1) CURR3 " + res))
                .then(() => pollComparison(accounts[1], pollId, expected))
                .then(() => checkDeletion(accounts[1], pollId))
                .then(() =>
                {
                    return instance.hasBeenRevealed.call(pollId, {from: accounts[1]});
                })
                .then((result) => { 
                    assert.equal(true, result, "node should have been revealed");
                });
            });
        });
    });
  it("double reveal attempt (by single sender) for single poll", function() {
      var expected = {
        votesFor: 1,
        votesAgainst: 0
      };

      let user = accounts[1];

    let instance;
    return PLCRVoting.deployed()
    .then((_instance) => 
        {
            instance = _instance;
            instance.loadTokens(10, {from: user})
        })
    .then(() => 
        {
            startPolls(1, function (pollIds) {
                var pollId = pollIds[0];
                var hash = createVoteHash(1, 100);
                instance.commitVote(pollId, hash, 10, 0, {from: user})
                .then(() => increaseTime(1000001))
                .then(() => instance.revealPeriodActive.call(pollId))
                .then((res) => console.log("(Test 2)REVEAL PERIOD ACTIVE STATE1: " + res))
                .then(() => getBlockTimestamp())
                .then((res) => console.log("(Test 2) CURR " + res))
                .then(() => instance.revealVote(pollId, 100, 1, {from: user}))
                .then(() => pollComparison(user, pollId, expected))
                .then(() => checkDeletion(user, pollId))
                .then(() => getBlockTimestamp())
                .then((res) => console.log("(Test 2) CURR " + res))
                .then(() => instance.revealPeriodActive.call(pollId))
                .then((res) => console.log("REVEAL PERIOD ACTIVE STATE1.5: " + res))
                .then(() => instance.hasBeenRevealed.call(pollId, {from: user}))
                .then((result) => assert.equal(true, result, "node should have been revealed"))
                .then(() => instance.revealVote(pollId, 100, 1, {from: user}))
                .catch((err) => console.log("(Test 2)" + err + "TODO: CHANGE TO CHECK FOR SPECIFIC ERROR."))
                .then(() => getBlockTimestamp())
                .then((res) => console.log("(Test 2) CURR " + res))
                .then(() => instance.revealPeriodActive.call(pollId))
                .then((res) => console.log("(Test 2)REVEAL PERIOD ACTIVE STATE2: " + res))
                .then(() => instance.pollMap.call(pollId))
                .then((res) => console.log("(Test 2)HERE WE ARE " + res.toString())) 
                .then(() => getBlockTimestamp())
                .then((res) => console.log("(Test 2) CURR " + res))
                .then(() => instance.hasBeenRevealed.call(pollId, {from: user}))
                .then((result) => assert.equal(true, result, "Why is node not revealed?"))
                .then(() => pollComparison(user, pollId, expected)) // Make sure results of poll have not changed after calling reveal twice
            });
        });
  });
  it("single reveal different vote than committed vote to single poll", function() {
      var expected = {
        votesFor: 0,
        votesAgainst: 0
      };

    return PLCRVoting.deployed()
    .then(function(instance) {
        return instance.loadTokens(10, {from: accounts[2]})
        .then(() => {
            startPolls(1, function (pollIds) {
                    var pollId = pollIds[0];
                    var hash = createVoteHash(1, 100);
                    instance.commitVote(pollId, hash, 10, 0, {from: accounts[2]})
                    .then(() => {
                      increaseTime(5)
                        .then(() => instance.revealVote(pollId, 100, 0, {from: accounts[2]}))
                        .then(() => pollComparison(accounts[2], pollId, expected))
                        .then(() =>
                        {
                            return instance.hasBeenRevealed.call(pollId, {from: accounts[2]});
                        })
                        .then((result) => { 
                            assert.equal(false, result, "node should not have been revealed");
                        });
                    });
                });
            });
        });
  });

  it("single reveal for no commit to single poll", function() {

      var expected = {
        votesFor: 0,
        votesAgainst: 0
      };

    return PLCRVoting.deployed()
    .then(function(instance) {
        return instance.loadTokens(50, {from: accounts[1]})
        .then(() => 
            {
                startPolls(1, function (pollIds) {
                    var pollId = pollIds[0];
                    var hash = createVoteHash(1, 100);
                      increaseTime(11)
                        .then(() => instance.revealVote(pollId, 100, 1, {from: accounts[1]}))
                        .then(() => pollComparison(accounts[1], pollId, expected))
                        .then(() =>
                        {
                            return instance.hasBeenRevealed.call(pollId, {from: accounts[1]});
                        })
                        .then((result) => { 
                            assert.equal(false, result, "node should not have been revealed");
                        });
                });
            });
        });
    });


  it("three reveals for three commits (different senders) to single poll", function() {
      var expected1 = {
            votesFor: 1,
            votesAgainst: 0
          };
      var expected2 = {
            votesFor: 1,
            votesAgainst: 1
      };
      var expected3 = {
            votesFor: 2,
            votesAgainst: 1
      };

        return PLCRVoting.deployed()
        .then(function(instance) {
            return instance.loadTokens(20, {from: accounts[2]})
            .then(() => instance.loadTokens(20, {from: accounts[3]}))
            .then(() => instance.loadTokens(20, {from: accounts[4]}))
            .then(() =>
                {
                    startPolls(1, function (pollIds) {
                        var pollId = pollIds[0];
                        var hash1 = createVoteHash(1, 100);
                        var hash2 = createVoteHash(0, 50);
                        var hash3 = createVoteHash(1, 10);
                        instance.commitVote(pollId, hash1, 10, 0, {from: accounts[2]})
                        .then(() => instance.commitVote(pollId, hash2, 11, 0, {from: accounts[3]}))
                        .then(() => instance.commitVote(pollId, hash3, 12, 0, {from: accounts[4]}))
                        .then(() => {
                          increaseTime(11)
                            .then(() => instance.revealVote(pollId, 100, 1, {from: accounts[2]}))
                            .then(() => pollComparison(accounts[2], pollId, expected1))
                            .then(() => checkDeletion(accounts[2], pollId))
                            .then(() => instance.hasBeenRevealed.call(pollId, {from: accounts[2]}))
                            .then((result) => assert.equal(true, result, "acct[2] node should have been revealed"))
                            .then(() => instance.hasBeenRevealed.call(pollId, {from: accounts[3]}))
                            .then((result) => assert.equal(false, result, "acct[3] node should not have been revealed yet"))
                             .then(() => instance.hasBeenRevealed.call(pollId, {from: accounts[4]}))
                            .then((result) => assert.equal(false, result, "acct[4] node should not have been revealed yet"))
                            
                            .then(() => instance.revealVote(pollId, 50, 0, {from: accounts[3]}))
                            .then(() => pollComparison(accounts[3], pollId, expected2))
                            .then(() => checkDeletion(accounts[3], pollId))
                            .then(() => instance.hasBeenRevealed.call(pollId, {from: accounts[3]}))
                            .then((result) => assert.equal(true, result, "acct[3] node should have been revealed"))
                            .then(() => instance.revealVote(pollId, 10, 1, {from: accounts[4]}))
                            .then(() => pollComparison(accounts[4], pollId, expected3))
                            .then(() => checkDeletion(accounts[4], pollId))
                            .then(() => instance.hasBeenRevealed.call(pollId, {from: accounts[4]}))
                            .then((result) => assert.equal(true, result, "acct[4] node should have been revealed"))
                        });
                    });
                });
            });

  });
  it("three reveals for three commits (single sender) to three different polls", function() {
      var expected1 = {
            votesFor: 1,
            votesAgainst: 0
          };
      var expected2 = {
            votesFor: 0,
            votesAgainst: 1
      };
      var expected3 = {
            votesFor: 1,
            votesAgainst: 0
      };
      return PLCRVoting.deployed()
        .then(function(instance) {
            return instance.loadTokens(100, {from: accounts[5]})
            .then(() =>
                {
                    startPolls(3, function (pollIds) {
                        var hash1 = createVoteHash(1, 100);
                        var hash2 = createVoteHash(0, 50);
                        var hash3 = createVoteHash(1, 10);
                        instance.commitVote(pollIds[0], hash1, 50, 0, {from: accounts[5]})
                        .then(() => instance.getCommitHash(pollIds[0], {from: accounts[5]}))
                        .then(() => instance.commitVote(pollIds[1], hash2, 51, pollIds[0], {from: accounts[5]}))
                        .then(() => instance.commitVote(pollIds[2], hash3, 72, pollIds[1], {from: accounts[5]}))
                        .then(() => {
                          increaseTime(11)
                            .then(() => instance.revealVote(pollIds[0], 100, 1, {from: accounts[5]}))
                            .then(() => pollComparison(accounts[5], pollIds[0], expected1))
                            .then(() => checkDeletion(accounts[5], pollIds[0]))
                            .then(() => instance.hasBeenRevealed.call(pollIds[0], {from: accounts[5]}))
                            .then((result) => assert.equal(true, result, "pollIds[0] node should have been revealed"))
                            .then(() => instance.hasBeenRevealed.call(pollIds[1], {from: accounts[5]}))
                            .then((result) => assert.equal(false, result, "pollIds[1] node should not have been revealed yet"))
                             .then(() => instance.hasBeenRevealed.call(pollIds[2], {from: accounts[5]}))
                            .then((result) => assert.equal(false, result, "pollIds[2] node should not have been revealed yet"))
                            .then(() => instance.revealVote(pollIds[1], 50, 0, {from: accounts[5]}))
                            .then(() => instance.getCommitHash.call(pollIds[2], {from: accounts[5]}))
                            .then(() => pollComparison(accounts[5], pollIds[1], expected2))
                            .then(() => checkDeletion(accounts[5], pollIds[1]))
                            .then(() => instance.hasBeenRevealed.call(pollIds[1], {from: accounts[5]}))
                            .then((result) => assert.equal(true, result, "pollIds[1] node should have been revealed"))
                            .then(() => instance.hasBeenRevealed.call(pollIds[0], {from: accounts[5]}))
                            .then((result) => assert.equal(true, result, "pollIds[0] node should have been revealed"))
                            .then(() => instance.hasBeenRevealed.call(pollIds[2], {from: accounts[5]}))
                            .then((result) => assert.equal(false, result, "pollIds[1] node should not have been revealed"))
                            .then(() => instance.revealVote(pollIds[2], 10, 1, {from: accounts[5]}))
                            .then(() => pollComparison(accounts[5], pollIds[2], expected3))
                            .then(() => checkDeletion(accounts[5], pollIds[2]))
                            .then(() => instance.hasBeenRevealed.call(pollIds[2], {from: accounts[5]}))
                            .then((result) => assert.equal(true, result, "pollIds[2] node should have been revealed"))
                        });
                    });
                });
            });
  });

  it("single reveal after reveal expiration date", function() {
    return PLCRVoting.deployed()
    .then(function(instance) {
    })
  });
});
