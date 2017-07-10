const VotingContract = artifacts.require("./PLCRVoting.sol");
const PLCRVoting = artifacts.require("./PLCRVoting.sol");
const HumanStandardToken = artifacts.require("./HumanStandardToken.sol");
const abi = require("ethereumjs-abi");
const BN = require("bn.js");

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

// regular expression to check for invalid opcode error
const re = new RegExp("(invalid opcode)","i");

contract('Commit Testing', function(accounts) { 
	const [owner, user1, user2, user3, user4, user5, user6] = accounts;
	const tokenAmt = 10;

    function voteMapComparisonTest(user, pollID, attrNameToExpectedValueMap) {
        var promises = [];
        return new Promise(function(resolve, reject) {
                VotingContract.deployed()
                .then(function(instance) {
                Object.keys(attrNameToExpectedValueMap).forEach(function (key) {
                    var holder = {};
                    holder.key = key;
                    if (holder.key !== "commitHash") {
                        promises.push(instance.voteMap.call(createIndexHash(user, pollID, key)).then(function(result) {
                            assert.equal(attrNameToExpectedValueMap[holder.key], result, "VoteMap had wrong value for " + holder.key);         
                        }));
                    } else {
                        promises.push(instance.getCommitHash.call(pollID, {from: user}).then(function(result) {
                            assert.equal(attrNameToExpectedValueMap[holder.key], result, "VoteMap had wrong value for " + holder.key);         
                        }));
                    }
                });
                Promise.all(promises).then(() => resolve());
            });
        });
    }

    function startPolls(numOfPolls, callback) {
        var ids = [];
        var promises = [];
        VotingContract.deployed()
        .then(function (instance) {
            for (var i = 0; i < numOfPolls; i++) {
                promises.push(instance.startPoll("", 50)
                    .then((result) => {
                        ids.push(result.logs[0].args.pollID.toString());
                    }));
            }
            Promise.all(promises).then(() => callback(ids));
        });
    }

    it("validate node, empty double linked-list", function() {
        return PLCRVoting.deployed()
        .then(function(instance) {
            return instance.validateNode.call(0, 1, 100); 
        })
        .then(function(result) {
            assert.equal(result, true, "should have been valid");
        });
    });
      
    it("validate node, single element double linked-list", function() {
      let voter;
      return PLCRVoting.deployed()
    .then(function(instance) {
            voter = instance;
            voter.insertToDll(1, 0, 5, "0xabc");
    }).then(function() {
            return voter.validateNode.call(1, 11, 50)
        })
        .then(function(result) {
            assert.equal(result, true, "should have been valid");
        });
    });
    it("validate node, 5 elements double linked-list", function() {
        let voter;
        let promiseList = [];
        return PLCRVoting.deployed()
    .then(function(instance) {
            voter = instance;
            promiseList.push(voter.insertToDll(1, 0, 5, "0xabc"));
        promiseList.push(voter.insertToDll(2, 1, 6, "0xbcd"));
            promiseList.push(voter.insertToDll(3, 2, 6, "0xbcd"));
            promiseList.push(voter.insertToDll(4, 3, 8, "0xabc"));
        promiseList.push(voter.insertToDll(5, 4, 9, "0xbcd"));
        });
        Promise.all(promiseList).then(function() {
            return voter.validateNode.call(3, 32, 7);
        })
        .then(function(result) {
            assert.equal(result, true, "should have been valid middle insert");
            return voter.validateNode.call(3, 33, 5);
        })
        .then(function(result) {
            assert.equal(result, false, "should have been invalid middle insert");
            return voter.validateNode.call(5, 34, 20);
        })
        .then(function(result) {
            assert.equal(result, true, "should have been valid end insert");
            return voter.validateNode.call(5, 35, 7);
        })
        .then(function(result) {
            assert.equal(result, false, "should have been invalid end insert");
            return voter.validateNode.call(0, 36, 5);
        })
        .then(function(result) {
            assert.equal(result, true, "should have been valid start insert");
            return voter.validateNode.call(0, 37, 6);
        })
        .then(function(result) {
            assert.equal(result, false, "should have been invalid start insert");
        });
    });
    it("validate node, single node deleted from 5 elements double linked-list", function() {
        let voter;
        let promiseList = [];
        return PLCRVoting.deployed()
    .then(function(instance) {
            voter = instance;
            promiseList.push(voter.insertToDll(1, 0, 5, "0xabc"));
        promiseList.push(voter.insertToDll(2, 1, 6, "0xbcd"));
            promiseList.push(voter.insertToDll(3, 2, 6, "0xbcd"));
            promiseList.push(voter.insertToDll(4, 3, 8, "0xabc"));
        promiseList.push(voter.insertToDll(5, 4, 9, "0xbcd"));
            promiseList.push(voter.deleteNode(4));
        });
        Promise.all(promiseList).then(function() {
            return voter.validateNode.call(3, 32, 7);
        })
        .then(function(result) {
            assert.equal(result, true, "should have been valid middle insert");
            return voter.validateNode.call(3, 33, 5);
        })
        .then(function(result) {
            assert.equal(result, false, "should have been invalid middle insert");
            return voter.validateNode.call(5, 34, 20);
        })
        .then(function(result) {
            assert.equal(result, true, "should have been valid end insert");
            return voter.validateNode.call(5, 35, 7);
        })
        .then(function(result) {
            assert.equal(result, false, "should have been invalid end insert");
            return voter.validateNode.call(0, 36, 5);
        })
        .then(function(result) {
            assert.equal(result, true, "should have been valid start insert");
            return voter.validateNode.call(0, 37, 6);
        })
        .then(function(result) {
            assert.equal(result, false, "should have been invalid start insert");
        });
    });
    it("validate node, multiple nodes deleted from 5 elements double linked-list", function() {
        let voter;
        let promiseList = [];
        return PLCRVoting.deployed()
    .then(function(instance) {
            voter = instance;
            promiseList.push(voter.insertToDll(1, 0, 5, "0xabc"));
        promiseList.push(voter.insertToDll(2, 1, 6, "0xbcd"));
            promiseList.push(voter.insertToDll(3, 2, 6, "0xbcd"));
            promiseList.push(voter.insertToDll(4, 3, 8, "0xabc"));
            promiseList.push(voter.deleteNode(2));
        promiseList.push(voter.insertToDll(5, 4, 9, "0xbcd"));
            promiseList.push(voter.deleteNode(4));
        });
        Promise.all(promiseList).then(function() {
            return voter.validateNode.call(3, 32, 7);
        })
        .then(function(result) {
            assert.equal(result, true, "should have been valid middle insert");
            return voter.validateNode.call(3, 33, 5);
        })
        .then(function(result) {
            assert.equal(result, false, "should have been invalid middle insert");
            return voter.validateNode.call(5, 34, 20);
        })
        .then(function(result) {
            assert.equal(result, true, "should have been valid end insert");
            return voter.validateNode.call(5, 35, 7);
        })
        .then(function(result) {
            assert.equal(result, false, "should have been invalid end insert");
            return voter.validateNode.call(0, 36, 5);
        })
        .then(function(result) {
            assert.equal(result, true, "should have been valid start insert");
            return voter.validateNode.call(0, 37, 6);
        })
        .then(function(result) {
            assert.equal(result, false, "should have been invalid start insert");
        });   
    });

    it("single commit (user1) to a single poll (commit period active)", function() {
        let voter;
        let pollId;
        var hash = createVoteHash(0, 79);

    	return VotingContract.deployed()
    	.then(function(instance) {
            voter = instance;
            return voter.loadTokens(10, {from: user1})
        })
        .then(function () {
            return voter.startPoll("potato", 50);
        }).then(function (result) {
            pollId = (result.logs[0].args.pollID.toString());
            return voter.commitVote(pollId, hash, 10, 0, {from: user1});
        }).then(() => 
            voteMapComparisonTest(user1, pollId, 
                {prevID: 0,
                 nextID: 0,
                 numTokens: 10,
                 commitHash: hash})
        );
    });
    
    it("three commits (single user2) to a single poll (commit period active)", function() {
        let voter;
        let pollId;
        var finalHash = createVoteHash(0, 80);

        return VotingContract.deployed()
        .then(function(instance) {
            voter = instance;
            return voter.loadTokens(20, {from: user2})
        })
        .then(function () {
            return voter.startPoll("apple", 50);
        }).then(function (result) {
            pollId = (result.logs[0].args.pollID.toString());
            return voter.commitVote(pollId, createVoteHash(0, 5), 10, 0, {from: user2});
        }).then(function () {
            return voter.commitVote(pollId, createVoteHash(1, 35), 2, 0, {from: user2});
        }).then(function () {
            return voter.commitVote(pollId, finalHash, 7, pollId, {from: user2});
        }).then(() =>
            voteMapComparisonTest(user2, pollId, 
                {prevID: 0,
                 nextID: 0,
                 numTokens: 7,
                 commitHash: finalHash})
        )
    });
    it("multiple commits (different users) to a single poll (commit period active)", function() {
        let voter;
        let pollId;
        var finalHash1 = createVoteHash(0, 80);
        var finalHash2 = createVoteHash(0, 81);
        var finalHash3 = createVoteHash(1, 31);

        return VotingContract.deployed()
        .then(function(instance) {
            voter = instance;
            return voter.loadTokens(10, {from: user3})
        })
        .then(() => voter.loadTokens(10, {from: user4}))
        .then(() => voter.loadTokens(10, {from: user5}))
        .then(() => voter.startPoll("orange", 50))
        .then((result) => pollId = result.logs[0].args.pollID.toString())
        .then(() => voter.commitVote(pollId, finalHash1, 9, 0, {from: user3}))
        .then(() =>
            voter.commitVote(pollId, finalHash2, 2, 0, {from: user4}))
        .then(() =>
            voter.commitVote(pollId, finalHash3, 7, 0, {from: user5}))
        .then(() => 
            voteMapComparisonTest(user3, pollId, 
                {prevID: 0,
                 nextID: 0,
                 numTokens: 9,
                 commitHash: finalHash1}))
        .then(() =>
            voteMapComparisonTest(user4, pollId, 
                {prevID: 0,
                 nextID: 0,
                 numTokens: 2,
                 commitHash: finalHash2}))
        .then(() =>
            voteMapComparisonTest(user5, pollId, 
                {prevID: 0,
                 nextID: 0,
                 numTokens: 7,
                 commitHash: finalHash3}));
    });


    it("single commit, exceeded number of spendable tokens for address", function() {
        // Should throw invalid opcode

        let voter;
        return PLCRVoting.deployed()
        .then((instance) => {
            voter = instance;
            return voter.startPoll("proposal", 50)
        })
        .then((result) => {
            var pollId = result.logs[0].args.pollID.toString();
            return voter.commitVote(pollId, createVoteHash(1, 20), 
                10001, 0);
        }).catch((err) => assert.equal(re.test(err), true, "Expected error not found"));
    });
   
    it("single commit, past commit period expiration", function () {
        // Should throw invalid opcode
        let voter;
        let pollId;
        var hash = createVoteHash(0, 79);

    	return VotingContract.deployed()
    	.then(function(instance) {
            voter = instance;
            return voter.loadTokens(10, {from: user1})
        })
        .then(() => voter.startPoll("potato", 50))
        .then((result) => pollId = (result.logs[0].args.pollID.toString()))
        .then(() => increaseTime(1000001))
        .then(() => voter.commitVote(pollId, hash, 10, 0, {from: user1}))
        .catch((err) => assert.equal(re.test(err), true, "Expected error not found"))
        .then(() => 
            voteMapComparisonTest(user1, pollId, 
                {prevID: 0,
                 nextID: 0,
                 numTokens: 0,
                 commitHash: 0x0})
            );
    });
});
