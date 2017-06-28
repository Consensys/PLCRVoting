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
	const [owner, user1, user2, user3] = accounts;
	const tokenAmt = 10;

    function voteMapComparisonTest(user, pollID, attrNameToExpectedValueMap) {
        VotingContract.deployed()
        .then(function(instance) {
            Object.keys(attrNameToExpectedValueMap).forEach(function (key) {
                var holder = {};
                holder.key = key;
                if (holder.key !== "commitHash") {
                    promise = instance.voteMap.call(createIndexHash(user, pollID, key)).then(function(result) {
                        console.log(holder.key + " :: " + result);
                        assert.equal(attrNameToExpectedValueMap[holder.key], result, "VoteMap had wrong value for " + holder.key);         
                    });
                } else {
                    promise = instance.getCommitHash.call(pollID, {from: user}).then(function(result) {
                        console.log(holder.key + " :: " + result);
                        assert.equal(attrNameToExpectedValueMap[holder.key], result, "VoteMap had wrong value for " + holder.key);         
                    });
                }
            });
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
  it("single commit to a single poll (commit period active)", function() {
        let voter;
        let pollId;
        var hash = createVoteHash(0, 79);

	return VotingContract.deployed()
	.then(function(instance) {
            voter = instance;
            voter.loadTokens(10, {from: user1})
        })
        .then(function () {
            return voter.startPoll("potato", 50);
        }).then(function (result) {
            pollId = (result.logs[0].args.pollId.toString());
            voter.commitVote(pollId, hash, 10, 0, {from: user1});
        }).then(function () {
            voteMapComparisonTest(user1, pollId, 
                {prevID: 0,
                 nextID: 0,
                 numTokens: 10,
                 commitHash: hash})
        });
 
  });
  it("multiple commits to a single poll (commit period active)", function() {
	return PLCRVoting.deployed()
	.then(function(instance) {

	});
  });
  it("single commit to 2 polls (commit periods active)", function() {
	return PLCRVoting.deployed()
	.then(function(instance) {

	});
  });
  it("single commit to a single poll (commit period inactive)", function() {
	return PLCRVoting.deployed()
	.then(function(instance) {

	});
  });
  it("single commit to 3 polls (2 commit periods inactive)", function() {
	return PLCRVoting.deployed()
	.then(function(instance) {

	});
  });
  it("single commit, exceeded number of spendable tokens for address", function() {
	return PLCRVoting.deployed()
	.then(function(instance) {

	});
  });
});

var solidityVoteHasher = function (vote, salt) {
	return 0;
}

var solidityMapHasher = function (msgSender, pollId, attr) {
	return 0;
}
