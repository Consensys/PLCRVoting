const abi = require('ethereumjs-abi');
const BN = require('bn.js');
const PLCRVoting = artifacts.require("./PLCRVoting.sol");

contract('Voting', function(accounts) {
  /*
   * Utility Functions
   */

  // returns the solidity-sha3 output for VoteMap indexing
  function createIndexHash(account, pollID, atr) {
    let hash = "0x" + abi.soliditySHA3(
          [ "address", "uint", "string" ],
          [ new BN(account.slice(2), 16), pollID, atr ]
    ).toString('hex'); 
    return hash;
  }

  /*
   * Tests
   */


  it("getAttribute returns 0 when voteMap empty", function() {
    return PLCRVoting.deployed()
    .then(function(instance) {
      return instance.getAttribute.call('10', 'prevID');
    })
    .then(function(result) {
      assert.equal(Number(result), '0', "Testing failed.");
    });
  });

  it("setAttribute sets property correctly", function() {
    let voting;
    return PLCRVoting.deployed()
    .then(function(instance) {
      voting = instance;
      voting.setAttribute('10', 'prevID', '25', {from:accounts[0]});
      return voting.voteMap.call(
        createIndexHash(accounts[0], '10', 'prevID')
      );
    })
    .then(function(result) {
      assert.equal(result, '25', "Testing failed.");
    });
  });

  it("getAttribute gets previously set property correctly", function() {
    let voting;
    return PLCRVoting.deployed()
    .then(function(instance) {
      voting = instance;
      voting.setAttribute('10', 'prevID', '15');
      return voting.getAttribute.call('10', 'prevID');
    })
    .then(function(result) {
      assert.equal(result,'15', "Testing failed");
    });
  });

  it("getCommitHash returns correct commitHash", function() {
    let voting;
    let hash;
    return PLCRVoting.deployed()
    .then(function(instance) {
      voting = instance;
      hash = '0x1c817d209103a160ddcfed5d97912c7e207da04a8a9960c64875cecec0bfb0de';
      voting.setAttribute('10', 'commitHash', hash);
      return voting.getCommitHash.call('10');
    })
    .then(function(result) {
      assert.equal(result, hash, "Testing failed");
    });
  });

});
