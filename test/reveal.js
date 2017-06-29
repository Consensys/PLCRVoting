var PLCRVoting = artifacts.require("./PLCRVoting.sol");

contract('Voting (Reveal)', function(accounts) {
  it("single reveal for single commit to single poll", function() {
    return PLCRVoting.deployed()
    .then(function(instance) {
    })
  });
  it("single reveal for no commits to single poll", function() {
    return PLCRVoting.deployed()
    .then(function(instance) {
    })
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
