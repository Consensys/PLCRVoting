var PLCRVoting = artifacts.require("./PLCRVoting.sol");

contract('Voting', function(accounts) {
  // Check for non-existence of the single poll
  // and then the existence of the poll and then that the poll
  // is in commit phase
  it("start single poll", function() {
    let instance;
    let watcher;
    return PLCRVoting.deployed()
    .then(function(_instance) {
    	instance = _instance;
        return instance.startPoll("proposal", 50);
    })
    .then(function(result) {
    	assert.equal(result.logs[0].args.pollID.toString(), 
    		"1", "poll ID should have been 1");
    })
  });
  it("start three polls", function() {
    // Check for existence of the three polls and that they 
    // are in commit phase
    return PLCRVoting.deployed()
    .then(function(instance) {

    })
  });
  it("commit period correctly active", function() {
    // Check commit period active, reveal period inactive, poll not ended
    return PLCRVoting.deployed()
    .then(function(instance) {

    })
  });
  it("reveal period correctly active", function() {
    // Check commit period inactive, reveal period active
    return PLCRVoting.deployed()
    .then(function(instance) {

    })
  });
  it("poll ended", function() {
    // Check commit inactive, reveal inactive, poll ended
    return PLCRVoting.deployed()
    .then(function(instance) {

    })
  });
  it("trusted users are correct", function() {
    // Check if the trusted users are correct
    return PLCRVoting.deployed()
    .then(function(instance) {

    })
  });
  it("valid poll IDs when in commit period", function() {
    // Check if the started polls in the commit period are valid,
    return PLCRVoting.deployed()
    .then(function(instance) {

    })
  });
  it("valid poll IDs when in reveal period", function() {
    // Check if the started polls in the reveal period are valid,
    return PLCRVoting.deployed()
    .then(function(instance) {

    })
  });
  it("valid poll IDs when in ended period", function() {
    // Check if the started polls that have ended are valid,
    return PLCRVoting.deployed()
    .then(function(instance) {

    })
  });
  it("set commit duration", function() {
    // Check if setting the commit duration updates said variable
    return PLCRVoting.deployed()
    .then(function(instance) {

    })
  });
  it("set reveal duration", function() {
    // Check if setting the reveal duration updates said variable
    return PLCRVoting.deployed()
    .then(function(instance) {

    })
  });
  it("set vote quota", function() {
    // Check if setting the vote quota updates said variable
    return PLCRVoting.deployed()
    .then(function(instance) {

    })
  });
});
