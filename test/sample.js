var PLCRVoting = artifacts.require("./PLCRVoting.sol");

contract('Voting', function(accounts) {
  it("should return 10", function() {
    return PLCRVoting.deployed()
    .then(function(instance) {
      console.log("FUCK");
      return instance.foobar.call();
    })
    .then(function(result) {
      console.log(result)
      assert.equal(result, 10, "Testing failed.");
    });
  });
});