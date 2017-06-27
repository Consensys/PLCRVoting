const VotingContract = artifacts.require("./PLCRVoting.sol");
const PLCRVoting = artifacts.require("./PLCRVoting.sol");
const HumanStandardToken = artifacts.require("./HumanStandardToken.sol");

contract('Voting', function(accounts) {
 
	const [owner, user1, user2, user3] = accounts;
	const tokenAmt = 10;

  function voteMapComparisonTest(user, pollID, attrNameToExpectedValueMap) {
   VotingContract.deployed()
   .then(function(instance) {
    for (var key in Object.keys(attrNameToExpectedValueMap)) {
        instance.voteMap.call(key)
        .then(function(result) {
            if (key !== "commitHash") {
                assert.equal(attrNameToExpectedValueMap[key], result, "VoteMap had wrong value for " + key);
            } else {
                assert.notequal(attrNameToExpectedValueMap[key], result, "VoteMap commit hash not set");
            }
        });
    } 
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
        return PLCRVoting.deployed()
	.then(function(instance) {
            voter = instance;
            voter.insertToDll(1, 0, 5, "0xabc");
	    voter.insertToDll(2, 1, 6, "0xbcd");
            voter.insertToDll(3, 2, 6, "0xbcd");
            voter.insertToDll(4, 3, 8, "0xabc");
	    voter.insertToDll(5, 4, 9, "0xbcd");
        })
        .then(function() {
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
        });
  });
  it("validate node, single node deleted from 5 elements double linked-list", function() {
	return PLCRVoting.deployed()
	.then(function(instance) {

	});
  });
  it("validate node, multiple nodes deleted from 5 elements double linked-list", function() {
	return PLCRVoting.deployed()
	.then(function(instance) {
		
	});
  });
  it("single commit to a single poll (commit period active)", function() {
         let voter;
        let pollID;
	return VotingContract.deployed()
	.then(function(instance) {
            voter = instance;
            voter.loadTokens(10, {from: user1})
        })
        .then(function () {
            //voter.startPoll("potato", 50);
        }).then(function (result) {
            pollID = result.logs[0].args.pollID.toString();
            voter.commitVote(pollID, solidityHash(0, 79), 10, 0, {from: user1});
        }).then(function () {
            voteMapComparisonTest(user1, pollID, 
                {prevID: 0,
                 nextID: 0,
                 numTokens: 10,
                 commitHash: 0})
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
