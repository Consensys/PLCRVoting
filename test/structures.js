const abi = require('ethereumjs-abi');
const BN = require('bn.js');
const PLCRVoting = artifacts.require("./PLCRVoting.sol");

contract('Data Structure Testing', (accounts) => {
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

  it("should check getAttribute is 0 when voteMap empty", () => {
    return PLCRVoting.deployed()
    .then((instance) => instance.getAttribute.call('10', 'prevID'))
    .then((result) => assert.equal(Number(result), '0', "Testing failed."));
  });

  it("should check setAttribute sets property correctly", () => {
    let voting;
    return PLCRVoting.deployed()
    .then((instance) => voting = instance)
    .then(() => voting.setAttribute('10', 'prevID', '25'))
    .then(() => createIndexHash(accounts[0], '10', 'prevID'))
    .then((hash) => voting.voteMap.call(hash))
    .then((result) => assert.equal(Number(result), '25', "Testing failed."));
  });

  it("should get previously set property correctly", () => {
    let voting;
    return PLCRVoting.deployed()
    .then((instance) => voting = instance)
    .then(() => voting.setAttribute('10', 'prevID', '15'))
    .then(() => voting.getAttribute.call('10', 'prevID'))
    .then((result) => assert.equal(Number(result),'15', "Testing failed"));
  });

  
  it("should return correct commitHash", () => {
    let voting;
    let hash;
    return PLCRVoting.deployed()
    .then((instance) => voting = instance)
    .then(() => hash = '0x1c817d209103a160ddcfed5d97912c7e207da04a8a9960c64875cecec0bfb0de')
    .then(() => voting.setAttribute('10', 'commitHash', hash))
    .then(() => voting.getCommitHash.call('10'))
    .then((result) => assert.equal(String(result), hash, "Testing failed"));
  });

  it("should insert a new node correctly as the first element to a list originally of length 2", () => {
    let voting;
    let pollID = 5;
    let prevID = 0;
    let numTokens = 10;
    let commitHash = '0x1c817d209103a160ddcfed5d97912c7e207da04a8a9960c64875cecec0bfb0de';
    let next_0;
    let prev_1;
    let next_new;
    let prev_new;
    return PLCRVoting.deployed()
    .then((instance) => voting = instance)

    // initialize double linked list
    .then(() => voting.setAttribute('0', 'nextID', '1'))
    .then(() => voting.setAttribute('1', 'nextID', '2'))
    .then(() => voting.setAttribute('2', 'nextID', '0'))
    .then(() => voting.setAttribute('0', 'prevID', '2'))
    .then(() => voting.setAttribute('1', 'prevID', '0'))
    .then(() => voting.setAttribute('2', 'prevID', '1'))
    .then(() => voting.setAttribute('1', 'numTokens', '15'))
    .then(() => voting.setAttribute('2', 'numTokens', '20'))
    .then(() => voting.setAttribute('1', 'commitHash', '0xab817d209103a160ddcfed5d97912c7e207da04a8a9960c64875cecec0bfb0de'))
    .then(() => voting.setAttribute('2', 'commitHash', '0xca817d209103a160ddcfed5d97912c7e207da04a8a9960c64875cecec0bfb0de'))

    // use the function being tested
    .then(() => voting.insertToDll(pollID, prevID, numTokens, commitHash))

    // get attributes to check
    .then(() => voting.getAttribute.call('0', 'nextID'))
    .then((result) => next_0 = result)
    .then(() => voting.getAttribute.call('1', 'prevID'))
    .then((result) => prev_1 = result)
    .then(() => voting.getAttribute.call(pollID, 'nextID'))
    .then((result) => next_new = result)
    .then(() => voting.getAttribute.call(pollID, 'prevID'))
    .then((result) => prev_new = result)

    // check equality
    .then(() => {
      assert.equal(next_0, pollID, "Testing failed");
      assert.equal(prev_1, pollID, "Testing failed");
      assert.equal(next_new, '1', "Testing failed");
      assert.equal(prev_new, '0', "Testing failed");
    })
  });

  it("should insert a new node correctly as the last element to a list originally of length 2", () => {
    let voting;
    let pollID = 5;
    let prevID = 2;
    let numTokens = 25;
    let commitHash = '0x1c817d209103a160ddcfed5d97912c7e207da04a8a9960c64875cecec0bfb0de';
    let next_2;
    let prev_0;
    let next_new;
    let prev_new;
    return PLCRVoting.deployed()
    .then((instance) => voting = instance)

    // initialize double linked list
    .then(() => voting.setAttribute('0', 'nextID', '1'))
    .then(() => voting.setAttribute('1', 'nextID', '2'))
    .then(() => voting.setAttribute('2', 'nextID', '0'))
    .then(() => voting.setAttribute('0', 'prevID', '2'))
    .then(() => voting.setAttribute('1', 'prevID', '0'))
    .then(() => voting.setAttribute('2', 'prevID', '1'))
    .then(() => voting.setAttribute('1', 'numTokens', '15'))
    .then(() => voting.setAttribute('2', 'numTokens', '20'))
    .then(() => voting.setAttribute('1', 'commitHash', '0xab817d209103a160ddcfed5d97912c7e207da04a8a9960c64875cecec0bfb0de'))
    .then(() => voting.setAttribute('2', 'commitHash', '0xca817d209103a160ddcfed5d97912c7e207da04a8a9960c64875cecec0bfb0de'))

    // use the function being tested
    .then(() => voting.insertToDll(pollID, prevID, numTokens, commitHash))

    // get attributes to check
    .then(() => voting.getAttribute.call('2', 'nextID'))
    .then((result) => next_2 = result)
    .then(() => voting.getAttribute.call('0', 'prevID'))
    .then((result) => prev_0 = result)
    .then(() => voting.getAttribute.call(pollID, 'nextID'))
    .then((result) => next_new = result)
    .then(() => voting.getAttribute.call(pollID, 'prevID'))
    .then((result) => prev_new = result)

    // check equality
    .then(() => {
      assert.equal(next_2, pollID, "Testing failed");
      assert.equal(prev_0, pollID, "Testing failed");
      assert.equal(next_new, '0', "Testing failed");
      assert.equal(prev_new, '2', "Testing failed");
    });
  });
  
  it("should insert a new node correctly as the first element to an empty list", () => {
    let voting;
    let pollID = 20;
    let prevID = 0;
    let numTokens = 25;
    let commitHash = '0x1c817d209103a160ddcfed5d97912c7e207da04a8a9960c64875cecec0bfb0de';
    let next_0;
    let prev_0;
    let next_new;
    let prev_new;
    return PLCRVoting.deployed()
    .then((instance) => voting = instance)

    // use the function being tested
    .then(() => voting.insertToDll(pollID, prevID, numTokens, commitHash, {from:accounts[9]}))

    // get attributes to check
    .then(() => voting.getAttribute.call('0', 'nextID', {from:accounts[9]}))
    .then((result) => next_0 = result)
    .then(() => voting.getAttribute.call('0', 'prevID', {from:accounts[9]}))
    .then((result) => prev_0 = result)
    .then(() => voting.getAttribute.call(pollID, 'nextID', {from:accounts[9]}))
    .then((result) => next_new = result)
    .then(() => voting.getAttribute.call(pollID, 'prevID', {from:accounts[9]}))
    .then((result) => prev_new = result)

    // check equality
    .then(() => {
      assert.equal(next_0, pollID, "Testing failed");
      assert.equal(prev_0, pollID, "Testing failed");
      assert.equal(next_new, '0', "Testing failed");
      assert.equal(prev_new, '0', "Testing failed");
    });
  });
});
