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

contract('Voting', function(accounts) { 
	const [owner, user1, user2, user3, user4, user5, user6] = accounts;
	const tokenAmt = 10;

    function voteMapComparisonTest(user, pollID, attrNameToExpectedValueMap) {
        VotingContract.deployed()
        .then(function(instance) {
            Object.keys(attrNameToExpectedValueMap).forEach(function (key) {
                var holder = {};
                holder.key = key;
                if (holder.key !== "commitHash") {
                    // console.log(result);
                    instance.voteMap.call(createIndexHash(user, pollID, key)).then(function(result) {
                        assert.equal(attrNameToExpectedValueMap[holder.key], result, "VoteMap had wrong value for " + holder.key);         
                    });
                } else {
                    instance.getCommitHash.call(pollID, {from: user}).then(function(result) {
                        assert.equal(attrNameToExpectedValueMap[holder.key], result, "VoteMap had wrong value for " + holder.key);         
                    });
                }
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
                        ids.push(result.logs[0].args.pollId.toString());
                        // console.log(ids);
                    }));
            }
            Promise.all(promises).then(() => callback(ids));
        });
    }

  it("validate node, empty double linked-list", function() {
        return PLCRVoting.deployed()
        .then(function(instance) {
            return instance.validateNode.call(0, 100); 
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
            return voter.validateNode.call(1, 50)
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
            return voter.validateNode.call(3, 7);
        })
        .then(function(result) {
            assert.equal(result, true, "should have been valid middle insert");
            return voter.validateNode.call(3, 5);
        })
        .then(function(result) {
            assert.equal(result, false, "should have been invalid middle insert");
            return voter.validateNode.call(5, 20);
        })
        .then(function(result) {
            assert.equal(result, true, "should have been valid end insert");
            return voter.validateNode.call(5, 7);
        })
        .then(function(result) {
            assert.equal(result, false, "should have been invalid end insert");
            return voter.validateNode.call(0, 5);
        })
        .then(function(result) {
            assert.equal(result, true, "should have been valid start insert");
            return voter.validateNode.call(0,6);
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
            return voter.validateNode.call(3, 7);
        })
        .then(function(result) {
            assert.equal(result, true, "should have been valid middle insert");
            return voter.validateNode.call(3, 5);
        })
        .then(function(result) {
            assert.equal(result, false, "should have been invalid middle insert");
            return voter.validateNode.call(5, 20);
        })
        .then(function(result) {
            assert.equal(result, true, "should have been valid end insert");
            return voter.validateNode.call(5, 7);
        })
        .then(function(result) {
            assert.equal(result, false, "should have been invalid end insert");
            return voter.validateNode.call(0, 5);
        })
        .then(function(result) {
            assert.equal(result, true, "should have been valid start insert");
            return voter.validateNode.call(0,6);
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
            return voter.validateNode.call(3, 7);
        })
        .then(function(result) {
            assert.equal(result, true, "should have been valid middle insert");
            return voter.validateNode.call(3, 5);
        })
        .then(function(result) {
            assert.equal(result, false, "should have been invalid middle insert");
            return voter.validateNode.call(5, 20);
        })
        .then(function(result) {
            assert.equal(result, true, "should have been valid end insert");
            return voter.validateNode.call(5, 7);
        })
        .then(function(result) {
            assert.equal(result, false, "should have been invalid end insert");
            return voter.validateNode.call(0, 5);
        })
        .then(function(result) {
            assert.equal(result, true, "should have been valid start insert");
            return voter.validateNode.call(0,6);
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
            pollId = (result.logs[0].args.pollId.toString());
            return voter.commitVote(pollId, hash, 10, 0, {from: user1});
        }).then(function () {
            voteMapComparisonTest(user1, pollId, 
                {prevID: 0,
                 nextID: 0,
                 numTokens: 10,
                 commitHash: hash})
        });
  });
  it("three commits (single user2) to a single poll (commit period active)", function() {
        let voter;
        let pollId;
        var finalHash = createVoteHash(0, 80);

        return VotingContract.deployed()
        .then(function(instance) {
            voter = instance;
            return voter.loadTokens(10, {from: user2})
        })
        .then(function () {
            return voter.startPoll("apple", 50);
        }).then(function (result) {
            pollId = (result.logs[0].args.pollId.toString());
            return voter.commitVote(pollId, createVoteHash(0, 5), 10, 0, {from: user1});
        }).then(function () {
            return voter.commitVote(pollId, createVoteHash(1, 35), 2, 0, {from: user1});
        }).then(function () {
            return voter.commitVote(pollId, finalHash, 7, 0, {from: user2});
        }).then(function () {
            voteMapComparisonTest(user2, pollId, 
                {prevID: 0,
                 nextID: 0,
                 numTokens: 7,
                 commitHash: finalHash})
        });
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
        .then(function () {
            return voter.startPoll("orange", 50);
        }).then(function (result) {
            pollId = (result.logs[0].args.pollId.toString());
            return voter.commitVote(pollId, finalHash1, 9, 0, {from: user3});
        }).then(function () {
            return voter.commitVote(pollId, finalHash2, 2, 0, {from: user4});
        }).then(function () {
            return voter.commitVote(pollId, finalHash3, 7, 0, {from: user5});
        }).then(function () {
            voteMapComparisonTest(user3, pollId, 
                {prevID: 0,
                 nextID: 0,
                 numTokens: 9,
                 commitHash: finalHash1});
            voteMapComparisonTest(user4, pollId, 
                {prevID: 0,
                 nextID: 0,
                 numTokens: 2,
                 commitHash: finalHash2});
            voteMapComparisonTest(user5, pollId, 
                {prevID: 0,
                 nextID: 0,
                 numTokens: 7,
                 commitHash: finalHash3});
        });
  });

  function promiseChain(promise, funct) {
    if (typeof(promise) === "undefined") {
        promise = Promise.resolve('');
    }
    return promise.then(function () {
        funct();
    });
  }

  it("single commit (user6) to 5 polls (commit periods active)", function() {
        var hash = createVoteHash(0, 79);
        var promise;
        startPolls(5, function (pollIds) {
            VotingContract.deployed()
            .then(function (instance) {
                return instance.loadTokens(50, {from: user6})
                .then(() => {
                    for (var i = 0; i < pollIds.length; i++) {
                        let curr = pollIds[i];
                        let holder = {
                            id: curr,
                            tokens: curr,
                            prev: curr-1,
                            hash: hash
                        };
                        promise = promiseChain(promise, function () {
                            return instance.commitVote(holder.id, holder.hash, 
                                holder.tokens, holder.prev, {from: user6});
                        });
                    }
                    promise = promiseChain(promise, function () {
                        for (var i = 0; i < pollIds.length; i++) {
                            let curr = pollIds[i];

                            // Appropriately sets next to the next
                            // element in pollIds or 0 if curr is the 
                            // last element. Note: 0, not pollIds[0],
                            // is correct because the last element in the
                            // dll will point to 0
                            let next = 
                                (i + 1 < pollIds.length) ? pollIds[i + 1] : 0;
                            
                            voteMapComparisonTest(user6, curr, 
                            {prevID: curr - 1,
                             nextID: next,
                             numTokens: curr,
                             commitHash: hash});
                        }
                    });
                });
            });
        });
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
        var pollId = result.logs[0].args.pollId.toString();
        return voter.commitVote(pollId, createVoteHash(1, 20), 
            10001, 0);
    }).catch((err) => console.log("TODO: WHAT DO I PUT HERE"));
  });
});
