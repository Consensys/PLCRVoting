var PLCRVoting = artifacts.require("./PLCRVoting.sol");

contract('Voting', function(accounts) {
  it("validate node, empty double linked-list", function() {
	return PLCRVoting.deployed()
	.then(function(instance) {
		
	});
  });
  it("validate node, single element double linked-list", function() {
	return PLCRVoting.deployed()
	.then(function(instance) {

	});
  });
  it("validate node, 5 elements double linked-list", function() {
	return PLCRVoting.deployed()
	.then(function(instance) {

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
  	var pollId;
    return PLCRVoting.deployed()
    .then(function(instance) {
    	return instance.startPoll.call("foobar");
    })
    .then(function(result) {
    	pollId = result;
    	// Commit a single vote given no other polls committed to yet
        instance.commitVote(pollId, solidityVoteHasher(1, 11), 5, 0);   
    })
    .then(function(instance) {
    	return instance.voteMap
    			.call(solidityMapHasher(accounts[0], pollId));
    })
    .then(function(result) {
    	assert.notequal(result, 0, "Commit did not succeed");
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