var PLCRVoting = artifacts.require("./PLCRVoting.sol");

contract('Voting', function(accounts) {
  it("should reveal", function() {
    return PLCRVoting.deployed()
    .then(function(instance) {
      return instance.foobar.call();
    })
    .then(function(result) {
      console.log(result)
      assert.equal(result, 10, "Testing failed.");
    });
  });
});