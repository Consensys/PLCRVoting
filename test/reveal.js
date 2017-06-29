var PLCRVoting = artifacts.require("./PLCRVoting.sol");
const abi = require("ethereumjs-abi");
var HttpProvider = require('ethjs-provider-http');
var EthRPC = require('ethjs-rpc');
var ethRPC = new EthRPC(new HttpProvider('http://localhost:8545'));

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
                    assert.equal(votesFor, expected.votesFor, "votesFor incorrect");
                    assert.equal(votesAgainst, expected.votesAgainst, "votesAgainst inccorect");
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

 
    
  it.only("single reveal for single commit to single poll", function() {

      var expected = {
        votesFor: 1,
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
                    instance.commitVote(pollId, hash, 10, 0, {from: accounts[1]})
                    .then(() => {
                      increaseTime(11)
                        .then(() => instance.revealVote(pollId, 100, 1, {from: accounts[1]}))
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
        });
    });
  it("single reveal for no commits to single poll", function() {
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
                    increaseTime(11)
                    .then(() => 
                    {
                        return instance.revealVote(pollId, 100, 1, {from: accounts[1]})
                            .then(() => pollComparison(accounts[1], pollId, expected))
                    })
                    .then(() =>
                    {
                        return instance.hasBeenRevealed.call(pollId, {from: accounts[1]});
                    })
                    .then((result) => assert.equal(false, result, "node should not have been revealed"));
                });
            }
        );
    }
    );
  });

  it("single reveal different vote selection for single commit to single poll", function() {
    return PLCRVoting.deployed()
    .then(function(instance) {
    })
  });
  it("three reveals for three commits (different senders) to single poll", function() {
    return PLCRVoting.deployed()
    .then(function(instance) {
    })
  });
  it("single reveal after reveal expiration date", function() {
    return PLCRVoting.deployed()
    .then(function(instance) {
    })
  });
  it("double reveal attempt (by single sender) for single poll", function() {
    return PLCRVoting.deployed()
    .then(function(instance) {
    })
  });
});
