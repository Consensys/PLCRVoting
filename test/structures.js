require('./testHelpers.js')();

const PLCRVoting = artifacts.require("./PLCRVoting.sol");

contract('Data Structure Testing', (accounts) => {

  it("should check getAttribute is 0 when voteMap empty", () => {
    return PLCRVoting.deployed()
    .then((instance) => instance.getAttribute.call('10', 'prevID'))
    .then((result) => assert.equal(Number(result), '0', "Testing failed."));
  });

  it("should check setAttribute sets property", () => {
    let voting;
    return PLCRVoting.deployed()
    .then((instance) => voting = instance)
    .then(() => voting.setAttribute('10', 'prevID', '25'))
    .then(() => createIndexHash(accounts[0], '10', 'prevID'))
    .then((hash) => voting.voteMap.call(hash))
    .then((result) => assert.equal(Number(result), '25', "Testing failed."));
  });

  it("should get previously set property", () => {
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

  it("should insert a new node as the first element to a list originally of length 2", () => {
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

  it("should insert a new node as the last element to a list originally of length 2", () => {
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
  
  it("should insert a new node as the first element to an empty list", () => {
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

  it("should delete a node", () => {
    let voting;
    let next_0;
    let prev_25;
    let node_next;
    let node_prev;
    let pollID = '10';
    return PLCRVoting.deployed()
    .then((instance) => voting = instance)

    // initialize double linked list
    .then(() => voting.setAttribute('0', 'nextID', pollID, {from:accounts[8]}))
    .then(() => voting.setAttribute(pollID, 'nextID', '25', {from:accounts[8]}))
    .then(() => voting.setAttribute('25', 'nextID', '0', {from:accounts[8]}))
    .then(() => voting.setAttribute('0', 'prevID', '25', {from:accounts[8]}))
    .then(() => voting.setAttribute(pollID, 'prevID', '0', {from:accounts[8]}))
    .then(() => voting.setAttribute('25', 'prevID', pollID, {from:accounts[8]}))
    .then(() => voting.setAttribute(pollID, 'numTokens', '1200', {from:accounts[8]}))
    .then(() => voting.setAttribute('25', 'numTokens', '30000', {from:accounts[8]}))
    .then(() => voting.setAttribute(pollID, 'commitHash', '0xab817d209103a160ddcfed5d97912c7e207da04a8a9960c64875cecec0bfb0de', {from:accounts[8]}))
    .then(() => voting.setAttribute('25', 'commitHash', '0xca817d209103a160ddcfed5d97912c7e207da04a8a9960c64875cecec0bfb0de', {from:accounts[8]}))

    // use the function being tested
    .then(() => voting.deleteNode(pollID, {from:accounts[8]}))

    // get attributes to check
    .then(() => voting.getAttribute.call('0', 'nextID', {from:accounts[8]}))
    .then((result) => next_0 = result)
    .then(() => voting.getAttribute.call('25', 'prevID', {from:accounts[8]}))
    .then((result) => prev_25 = result)
    .then(() => voting.getAttribute.call(pollID, 'nextID', {from:accounts[8]}))
    .then((result) => node_next = result)
    .then(() => voting.getAttribute.call(pollID, 'prevID', {from:accounts[8]}))
    .then((result) => node_prev = result)

    // check equality
    .then(() => {
      assert.equal(next_0, '25', "Testing failed");
      assert.equal(prev_25, '0', "Testing failed");
      assert.equal(node_next, pollID, "Testing failed");
      assert.equal(node_prev, pollID, "Testing failed");
    });
  });

  it("should return the pollID of last node", () => {
    let voting;
    let pollID = '35';
    let lastNode;
    return PLCRVoting.deployed()
    .then((instance) => voting = instance)

    // initialize double linked list
    .then(() => voting.setAttribute('0', 'nextID', '10', {from:accounts[7]}))
    .then(() => voting.setAttribute('10', 'nextID', pollID, {from:accounts[7]}))
    .then(() => voting.setAttribute(pollID, 'nextID', '0', {from:accounts[7]}))
    .then(() => voting.setAttribute('0', 'prevID', pollID, {from:accounts[7]}))
    .then(() => voting.setAttribute('10', 'prevID', '0', {from:accounts[7]}))
    .then(() => voting.setAttribute(pollID, 'prevID', '10', {from:accounts[7]}))
    .then(() => voting.setAttribute('10', 'numTokens', '1200', {from:accounts[7]}))
    .then(() => voting.setAttribute(pollID, 'numTokens', '30000', {from:accounts[7]}))
    .then(() => voting.setAttribute('10', 'commitHash', '0xca817d209103a160ddcfed5d97912c7e207da04a8a9960c64875cecec0bfb0de', {from:accounts[7]}))
    .then(() => voting.setAttribute(pollID, 'commitHash', '0xab817d209103a160ddcfed5d97912c7e207da04a8a9960c64875cecec0bfb0de', {from:accounts[7]}))

    // use the function being tested
    .then(() => voting.getLastNode.call({from:accounts[7]}))
    .then((result) => lastNode = result)

    // get attributes to check
    .then(() => voting.getAttribute.call('0', 'prevID', {from:accounts[7]}))
    .then((result) => prev_0 = result)

    // check equality
    .then(() => {
      assert.equal(Number(lastNode), Number(prev_0), "Testing failed");
    });
  });

  it("should return the max number of tokens locked for user, assuming the dll is sorted", () => {
    let voting;
    let pollID = '35';
    let maxNumTokens;
    return PLCRVoting.deployed()
    .then((instance) => voting = instance)

    // initialize double linked list
    .then(() => voting.setAttribute('0', 'nextID', '10', {from:accounts[6]}))
    .then(() => voting.setAttribute('10', 'nextID', pollID, {from:accounts[6]}))
    .then(() => voting.setAttribute(pollID, 'nextID', '0', {from:accounts[6]}))
    .then(() => voting.setAttribute('0', 'prevID', pollID, {from:accounts[6]}))
    .then(() => voting.setAttribute('10', 'prevID', '0', {from:accounts[6]}))
    .then(() => voting.setAttribute(pollID, 'prevID', '10', {from:accounts[6]}))
    .then(() => voting.setAttribute('10', 'numTokens', '1200', {from:accounts[6]}))
    .then(() => voting.setAttribute(pollID, 'numTokens', '30000', {from:accounts[6]}))
    .then(() => voting.setAttribute('10', 'commitHash', '0xca817d209103a160ddcfed5d97912c7e207da04a8a9960c64875cecec0bfb0de', {from:accounts[6]}))
    .then(() => voting.setAttribute(pollID, 'commitHash', '0xab817d209103a160ddcfed5d97912c7e207da04a8a9960c64875cecec0bfb0de', {from:accounts[6]}))

    // use the function being tested
    .then(() => voting.getMaxTokens.call({from:accounts[6]}))
    .then((result) => maxNumTokens = result)

    // check equality
    .then(() => {
      assert.equal(maxNumTokens, '30000', "Testing failed");
    });
  });
});
