require('./testHelpers.js')();

const PLCRVoting = artifacts.require("./PLCRVoting.sol");
const HumanStandardToken = artifacts.require("./HumanStandardToken.sol");

const commitDuration = '1000000';
const revealDuration = '1000000';

// regular expression to check for invalid opcode error
const re = new RegExp("(invalid opcode)","i");

contract('Commit Testing', function(accounts) { 
    const [owner, user1, user2, user3, user4, user5, user6] = accounts;
    const tokenAmt = 10;

    function voteMapComparisonTest(user, pollID, attrNameToExpectedValueMap) {
        var promises = [];
        return new Promise(function(resolve, reject) {
                PLCRVoting.deployed()
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
        PLCRVoting.deployed()
        .then(function (instance) {
            for (var i = 0; i < numOfPolls; i++) {
                promises.push(instance.startPoll("", 50, commitDuration, revealDuration)
                    .then((result) => {
                        ids.push(result.logs[0].args.pollID.toString());
                    }));
            }
            Promise.all(promises).then(() => callback(ids));
        });
    }

    it("should validate node given empty double linked-list", function() {

        let validateInfo = {
            prevId: 0,
            pollId: 1,
            numTokens: 100
        }

        return PLCRVoting.deployed()
        .then(function(instance) {
            return instance.validateNode.call(validateInfo.prevId, validateInfo.pollId, validateInfo.numTokens); 
        })
        .then(function(result) {
            assert.equal(result, true, "should have been valid");
        });
    });
      
    it("should validate node given single element double linked-list", function() {
      let voter;

      let nodeInfo = {
          prevId : 0,
          pollId : 1,
          numTokens : 5,
          hash: "0xabc"
      };
        
        let validateInfo = {
          prevId : 1,
          pollId : 11,
          numTokens : 50
      };
      
      return PLCRVoting.deployed()
    .then(function(instance) {
            voter = instance;
            voter.insertToDll(nodeInfo.pollId, nodeInfo.prevId, nodeInfo.numTokens, nodeInfo.hash);
    }).then(function() {
            return voter.validateNode.call(validateInfo.prevId, validateInfo.pollId, validateInfo.numTokens)
        })
        .then(function(result) {
            assert.equal(result, true, "should have been valid");
        });
    });

    it("should validate node given 5 elements double linked-list", function() {
        let voter;
        let promiseList = [];

        let node1 = {
                prevId: 0,
                pollId: 1,
                numTokens: 5,
                hash: "0x1" 
            };
        let node2 = {
                prevId: node1.pollId,
                pollId: 2,
                numTokens: 6,
                hash: "0x2"
            };
        let node3 = {
                prevId: node2.pollId,
                pollId: 3,
                numTokens: 6,
                hash: "0x3"
            };  
        let node4 = {
                prevId: node3.pollId,
                pollId: 4,
                numTokens: 8,
                hash: "0x4"
            };
        let node5 = {
                prevId: node4.pollId,
                pollId: 5,
                numTokens: 9,
                hash: "0x5"
            };

        let validateInfoValidMiddleInsert = {
            prevId: 3,
            pollId: 32,
            numTokens: 7
        };

        let validateInfoInvalidMiddleInsert = {
            prevId: 3,
            pollId: 33,
            numTokens: 5
        };

        let validateInfoValidEndInsert = {
            prevId: 5,
            pollId: 34,
            numTokens: 20
        };

        let validateInfoInvalidEndInsert = {
            prevId: 5,
            pollId: 35,
            numTokens: 7 
        };

        let validateInfoValidStartInsert = {
            prevId: 0,
            pollId: 36,
            numTokens: 5 
        };
        
        let validateInfoInvalidStartInsert = {
            prevId: 0,
            pollId: 37,
            numTokens: 6 
        };

        return PLCRVoting.deployed()
        .then(function(instance) {
            voter = instance;
            promiseList.push(voter.insertToDll(node1.pollId, node1.prevId, node1.numTokens, node1.hash));
            promiseList.push(voter.insertToDll(node2.pollId, node2.prevId, node2.numTokens, node2.hash));
            promiseList.push(voter.insertToDll(node3.pollId, node3.prevId, node3.numTokens, node3.hash));
            promiseList.push(voter.insertToDll(node4.pollId, node4.prevId, node4.numTokens, node4.hash));
            promiseList.push(voter.insertToDll(node5.pollId, node5.prevId, node5.numTokens, node5.hash));
        });
        Promise.all(promiseList).then(function() {
            return voter.validateNode.call(validateInfoValidMiddleInsert.prevId, validateInfoValidMiddleInsert.pollId, validateInfoValidMiddleInsert.numTokens);
        })
        .then(function(result) {
            assert.equal(result, true, "should have been valid middle insert");
            return voter.validateNode.call(validateInfoInvalidMiddleInsert.prevId, validateInfoInvalidMiddleInsert.pollID, validateInfoInvalidMiddleInsert.numTokens);
        })
        .then(function(result) {
            assert.equal(result, false, "should have been invalid middle insert");
            return voter.validateNode.call(validateInfoValidEndInsert.prevId, validateInfoValidEndInsert.pollId, validateInfoValidEndInsert.numTokens);
        })
        .then(function(result) {
            assert.equal(result, true, "should have been valid end insert");
            return voter.validateNode.call(validateInfoInvalidEndInsert.prevId, validateInfoInvalidEndInsert.pollId, validateInfoInvalidEndInsert.numTokens);
        })
        .then(function(result) {
            assert.equal(result, false, "should have been invalid end insert");
            return voter.validateNode.call(validateInfoValidStartInsert.prevId, validateInfoValidStartInsert.pollId, validateInfoValidStartInsert.numTokens);
        })
        .then(function(result) {
            assert.equal(result, true, "should have been valid start insert");
            return voter.validateNode.call(validateInfoInvalidStartInsert.prevId, validateInfoInvalidStartInsert.pollId, validateInfoInvalidStartInsert.numTokens);
        })
        .then(function(result) {
            assert.equal(result, false, "should have been invalid start insert");
        });
    });

    it("should validate node given single node deleted from 5 elements double linked-list", function() {
        let voter;
        let promiseList = [];
       
        let node1 = {
                prevId: 0,
                pollId: 1,
                numTokens: 5,
                hash: "0x1" 
            };
        let node2 = {
                prevId: node1.pollId,
                pollId: 2,
                numTokens: 6,
                hash: "0x2"
            };
        let node3 = {
                prevId: node2.pollId,
                pollId: 3,
                numTokens: 6,
                hash: "0x3"
            };  
        let node4 = {
                prevId: node3.pollId,
                pollId: 4,
                numTokens: 8,
                hash: "0x4"
            };
        let node5 = {
                prevId: node4.pollId,
                pollId: 5,
                numTokens: 9,
                hash: "0x5"
            };

        let validateInfoValidMiddleInsert = {
            prevId: 3,
            pollId: 32,
            numTokens: 7
        };

        let validateInfoInvalidMiddleInsert = {
            prevId: 3,
            pollId: 33,
            numTokens: 5
        };

        let validateInfoValidEndInsert = {
            prevId: 5,
            pollId: 34,
            numTokens: 20
        };

        let validateInfoInvalidEndInsert = {
            prevId: 5,
            pollId: 35,
            numTokens: 7 
        };

        let validateInfoValidStartInsert = {
            prevId: 0,
            pollId: 36,
            numTokens: 5 
        };
        
        let validateInfoInvalidStartInsert = {
            prevId: 0,
            pollId: 37,
            numTokens: 6 
        };


        
        return PLCRVoting.deployed()
        .then(function(instance) {
            voter = instance;
            promiseList.push(voter.insertToDll(node1.pollId, node1.prevId, node1.numTokens, node1.hash));
            promiseList.push(voter.insertToDll(node2.pollId, node2.prevId, node2.numTokens, node2.hash));
            promiseList.push(voter.insertToDll(node3.pollId, node3.prevId, node3.numTokens, node3.hash));
            promiseList.push(voter.insertToDll(node4.pollId, node4.prevId, node4.numTokens, node4.hash));
            promiseList.push(voter.insertToDll(node5.pollId, node5.prevId, node5.numTokens, node5.hash));
            promiseList.push(voter.deleteNode(4));
        });
        Promise.all(promiseList).then(function() {
            return voter.validateNode.call(validateInfoValidMiddleInsert.prevId, validateInfoValidMiddleInsert.pollId, validateInfoValidMiddleInsert.numTokens);
        })
        .then(function(result) {
            assert.equal(result, true, "should have been valid middle insert");
            return voter.validateNode.call(validateInfoInvalidMiddleInsert.prevId, validateInfoInvalidMiddleInsert.pollID, validateInfoInvalidMiddleInsert.numTokens);
        })
        .then(function(result) {
            assert.equal(result, false, "should have been invalid middle insert");
            return voter.validateNode.call(validateInfoValidEndInsert.prevId, validateInfoValidEndInsert.pollId, validateInfoValidEndInsert.numTokens);
        })
        .then(function(result) {
            assert.equal(result, true, "should have been valid end insert");
            return voter.validateNode.call(validateInfoInvalidEndInsert.prevId, validateInfoInvalidEndInsert.pollId, validateInfoInvalidEndInsert.numTokens);
        })
        .then(function(result) {
            assert.equal(result, false, "should have been invalid end insert");
            return voter.validateNode.call(validateInfoValidStartInsert.prevId, validateInfoValidStartInsert.pollId, validateInfoValidStartInsert.numTokens);
        })
        .then(function(result) {
            assert.equal(result, true, "should have been valid start insert");
            return voter.validateNode.call(validateInfoInvalidStartInsert.prevId, validateInfoInvalidStartInsert.pollId, validateInfoInvalidStartInsert.numTokens);
        })
        .then(function(result) {
            assert.equal(result, false, "should have been invalid start insert");
        });
    });

    it("should validate node given multiple nodes deleted from 5 elements double linked-list", function() {
        let voter;
        let promiseList = [];

        let node1 = {
                prevId: 0,
                pollId: 1,
                numTokens: 5,
                hash: "0x1" 
            };
        let node2 = {
                prevId: node1.pollId,
                pollId: 2,
                numTokens: 6,
                hash: "0x2"
            };
        let node3 = {
                prevId: node2.pollId,
                pollId: 3,
                numTokens: 6,
                hash: "0x3"
            };  
        let node4 = {
                prevId: node3.pollId,
                pollId: 4,
                numTokens: 8,
                hash: "0x4"
            };
        let node5 = {
                prevId: node4.pollId,
                pollId: 5,
                numTokens: 9,
                hash: "0x5"
            };

        let validateInfoValidMiddleInsert = {
            prevId: 3,
            pollId: 32,
            numTokens: 7
        };

        let validateInfoInvalidMiddleInsert = {
            prevId: 3,
            pollId: 33,
            numTokens: 5
        };

        let validateInfoValidEndInsert = {
            prevId: 5,
            pollId: 34,
            numTokens: 20
        };

        let validateInfoInvalidEndInsert = {
            prevId: 5,
            pollId: 35,
            numTokens: 7 
        };

        let validateInfoValidStartInsert = {
            prevId: 0,
            pollId: 36,
            numTokens: 5 
        };
        
        let validateInfoInvalidStartInsert = {
            prevId: 0,
            pollId: 37,
            numTokens: 6 
        };


        return PLCRVoting.deployed()
        .then(function(instance) {
            voter = instance;
            promiseList.push(voter.insertToDll(node1.pollId, node1.prevId, node1.numTokens, node1.hash));
            promiseList.push(voter.insertToDll(node2.pollId, node2.prevId, node2.numTokens, node2.hash));
            promiseList.push(voter.insertToDll(node3.pollId, node3.prevId, node3.numTokens, node3.hash));
            promiseList.push(voter.insertToDll(node4.pollId, node4.prevId, node4.numTokens, node4.hash));
            promiseList.push(voter.deleteNode(2));
            promiseList.push(voter.insertToDll(node5.pollId, node5.prevId, node5.numTokens, node5.hash));
            promiseList.push(voter.deleteNode(4));
        });
        Promise.all(promiseList).then(function() {
            return voter.validateNode.call(validateInfoValidMiddleInsert.prevId, validateInfoValidMiddleInsert.pollId, validateInfoValidMiddleInsert.numTokens);
        })
        .then(function(result) {
            assert.equal(result, true, "should have been valid middle insert");
            return voter.validateNode.call(validateInfoInvalidMiddleInsert.prevId, validateInfoInvalidMiddleInsert.pollID, validateInfoInvalidMiddleInsert.numTokens);
        })
        .then(function(result) {
            assert.equal(result, false, "should have been invalid middle insert");
            return voter.validateNode.call(validateInfoValidEndInsert.prevId, validateInfoValidEndInsert.pollId, validateInfoValidEndInsert.numTokens);
        })
        .then(function(result) {
            assert.equal(result, true, "should have been valid end insert");
            return voter.validateNode.call(validateInfoInvalidEndInsert.prevId, validateInfoInvalidEndInsert.pollId, validateInfoInvalidEndInsert.numTokens);
        })
        .then(function(result) {
            assert.equal(result, false, "should have been invalid end insert");
            return voter.validateNode.call(validateInfoValidStartInsert.prevId, validateInfoValidStartInsert.pollId, validateInfoValidStartInsert.numTokens);
        })
        .then(function(result) {
            assert.equal(result, true, "should have been valid start insert");
            return voter.validateNode.call(validateInfoInvalidStartInsert.prevId, validateInfoInvalidStartInsert.pollId, validateInfoInvalidStartInsert.numTokens);
        })
        .then(function(result) {
            assert.equal(result, false, "should have been invalid start insert");
        });   
    });

    it("should single commit (by user1) to a single poll (commit period active)", function() {
        let voter;
        let pollId;
        var hash = createVoteHash(0, 79);

        let tokensToLoad = 10;

        let commitInfo = {
            hash: hash,
            numTokens: 10,
            prevId: 0
        };

        let expectedVoteMapOutput = {
             prevID: 0,
             nextID: 0,
             numTokens: 10,
             commitHash: hash
        };

        return PLCRVoting.deployed()
        .then(function(instance) {
            voter = instance;
            return voter.loadTokens(tokensToLoad, {from: user1})
        })
        .then(function () {
            return voter.startPoll("potato", 50, commitDuration, revealDuration);
        }).then(function (result) {
            pollId = (result.logs[0].args.pollID.toString());
            return voter.commitVote(pollId, commitInfo.hash, commitInfo.numTokens, commitInfo.prevId, {from: user1});
        }).then(() => 
            voteMapComparisonTest(user1, pollId, expectedVoteMapOutput));
    });
    
    it("should three commits (by single user2) to a single poll (commit period active)", function() {
        let voter;
        let pollId;
        var finalHash = createVoteHash(0, 80);

        let commitInfo1 = {
            prevId: 0,
            numTokens: 10,
            hash: createVoteHash(0, 5)
        };
        let commitInfo2 = {
            prevId: 0,
            numTokens: 2,
            hash: createVoteHash(1, 35)
        };
        let commitInfo3 = {
            numTokens: 7,
            hash: finalHash       
        };  

        let expectedVoteMapOutput = {
             prevID: 0,
             nextID: 0,
             numTokens: 7,
             commitHash: finalHash
        };
        
        return PLCRVoting.deployed()
        .then(function(instance) {
            voter = instance;
            return voter.loadTokens(20, {from: user2})
        })
        .then(function () {
            return voter.startPoll("apple", 50, commitDuration, revealDuration);
        }).then(function (result) {
            pollId = (result.logs[0].args.pollID.toString());
            return voter.commitVote(pollId, commitInfo1.hash, commitInfo1.numTokens, commitInfo1.prevId, {from: user2});
        }).then(function () {
            return voter.commitVote(pollId, commitInfo2.hash, commitInfo2.numTokens, commitInfo2.prevId, {from: user2});
        }).then(function () {
            return voter.commitVote(pollId, commitInfo3.hash, commitInfo3.numTokens, pollId, {from: user2});
        }).then(() =>
            voteMapComparisonTest(user2, pollId, expectedVoteMapOutput)
        )
    });
    it("should multiple commits (different users) to a single poll (commit period active)", function() {
        let voter;
        let pollId;
        var finalHash1 = createVoteHash(0, 80);
        var finalHash2 = createVoteHash(0, 81);
        var finalHash3 = createVoteHash(1, 31);

        let numTokensToLoad = 10;

        let commitInfo1 = {
            hash: finalHash1,
            numTokens: 9,
            prevId: 0
        };

        let commitInfo2 = {
            hash: finalHash2,
            numTokens: 2,
            prevId: 0
        };

        let commitInfo3 = {
            hash: finalHash3,
            numTokens: 7,
            prevId: 0
        };

        let expectedVoteMapOutput1 = {
            prevId: 0,
            nextId: 0,
            numTokens: 9,
            commitHash: finalHash1
        };

        let expectedVoteMapOutput2 = {
            prevId: 0,
            nextId: 0,
            numTokens: 2,
            commitHash: finalHash2
        };

        let expectedVoteMapOutput3 = {
            prevId: 0,
            nextId: 0,
            numTokens: 7,
            commitHash: finalHash3
        };

        return PLCRVoting.deployed()
        .then(function(instance) {
            voter = instance;
            return voter.loadTokens(numTokensToLoad, {from: user3})
        })
        .then(() => voter.loadTokens(numTokensToLoad, {from: user4}))
        .then(() => voter.loadTokens(numTokensToLoad, {from: user5}))
        .then(() => voter.startPoll("orange", 50, commitDuration, revealDuration))
        .then((result) => pollId = result.logs[0].args.pollID.toString())
        .then(() => voter.commitVote(pollId, commitInfo1.hash, commitInfo1.numTokens, commitInfo1.prevId, {from: user3}))
        .then(() => voter.commitVote(pollId, commitInfo2.hash, commitInfo2.numTokens, commitInfo2.prevId, {from: user4}))
        .then(() => voter.commitVote(pollId, commitInfo3.hash, commitInfo3.numTokens, commitInfo3.prevId, {from: user5}))
        .then(() => 
            voteMapComparisonTest(user3, pollId, expectedVoteMapOutput1))
        .then(() =>
            voteMapComparisonTest(user4, pollId, expectedVoteMapOutput2))
        .then(() =>
            voteMapComparisonTest(user5, pollId, expectedVoteMapOutput3));
    });


    it("should attempt single commit that exceeds number of spendable tokens for address", function() {
        // Should throw invalid opcode

        let voter;
        return PLCRVoting.deployed()
        .then((instance) => {
            voter = instance;
            return voter.startPoll("proposal", 50, commitDuration, revealDuration)
        })
        .then((result) => {
            var pollId = result.logs[0].args.pollID.toString();
            return voter.commitVote(pollId, createVoteHash(1, 20), 
                10001, 0);
        }).catch((err) => assert.equal(re.test(err), true, "Expected error not found"));
    });
  
    it.only("should attempt single commit past commit period expiration", function () {
        // Should throw invalid opcode
        let voter;
        let pollId;
        let hash = createVoteHash(0, 79);

        return PLCRVoting.deployed()
        .then(function(instance) {
            voter = instance;
            return voter.loadTokens(10, {from: user1})
        })
        .then(() => voter.startPoll("potato", 50, commitDuration, revealDuration))
        .then((result) => pollId = (result.logs[0].args.pollID.toString()))
        .then(() => increaseTime(commitDuration + 100))
        .then(() => voter.commitVote(pollId, hash, 10, 0, {from: user1}))
        .catch((err) => {
            console.log("HIT ME");
            assert.equal(re.test(err), true, "Expected error not found")
        })
        .then(() => 
            voteMapComparisonTest(user1, pollId, 
                {prevID: 0,
                 nextID: 0,
                 numTokens: 0,
                 commitHash: 0x0})
            );
    });
});
