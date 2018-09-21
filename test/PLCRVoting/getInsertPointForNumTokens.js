/* eslint-env mocha */
/* global contract assert artifacts */

const PLCRVoting = artifacts.require('./PLCRVoting.sol');
const PLCRFactory = artifacts.require('./PLCRFactory.sol');
const EIP20 = artifacts.require('openzeppelin-solidity/contracts/token/ERC20/ERC20.sol');

const utils = require('./utils.js');

contract('PLCRVoting', (accounts) => {
  describe('Function: getInsertPointForNumTokens', () => {
    const [alice] = accounts;
    let plcr;
    let token;

    before(async () => {
      const plcrFactory = await PLCRFactory.deployed();
      const receipt = await plcrFactory.newPLCRWithToken('TestToken', 'TEST', '0', '10000');

      plcr = PLCRVoting.at(receipt.logs[0].args.plcr);
      token = EIP20.at(receipt.logs[0].args.token);

      await Promise.all(
        accounts.map(async (user) => {
          await token.transfer(user, 1000);
          await token.approve(plcr.address, 1000, { from: user });
        }),
      );
    });

    it('should return the correct insert point for a new node in a DLL', async () => {
      // Create { A: 1, B: 5, C: 10 }
      // Then insert { A: 1, D: 3, B: 5, C: 10 }
      // And then { A: 1, D: 3, B: 5, E: 7, C: 10 }
      const errMsg = 'Did not get proper insertion point';

      await utils.as(alice, plcr.requestVotingRights, 50);

      let receipt = await utils.as(alice, plcr.startPoll, 50, 100, 100);
      let pollID = utils.getPollIDFromReceipt(receipt);
      let secretHash = utils.createVoteHash(1, 420);
      let numTokens = 1;
      let insertPoint = await plcr.getInsertPointForNumTokens.call(alice, numTokens, pollID);
      assert.strictEqual(insertPoint.toString(10), '0', errMsg); // after root
      await utils.as(alice, plcr.commitVote, pollID, secretHash, numTokens, insertPoint);

      // { A: 1 }

      receipt = await utils.as(alice, plcr.startPoll, 50, 100, 100);
      pollID = utils.getPollIDFromReceipt(receipt);
      secretHash = utils.createVoteHash(1, 420);
      numTokens = 5;
      insertPoint = await plcr.getInsertPointForNumTokens.call(alice, numTokens, pollID);
      assert.strictEqual(insertPoint.toString(10), '1', errMsg); // after A
      await utils.as(alice, plcr.commitVote, pollID, secretHash, numTokens, insertPoint);

      // { A: 1, B: 5 }

      receipt = await utils.as(alice, plcr.startPoll, 50, 100, 100);
      pollID = utils.getPollIDFromReceipt(receipt);
      secretHash = utils.createVoteHash(1, 420);
      numTokens = 10;
      insertPoint = await plcr.getInsertPointForNumTokens.call(alice, numTokens, pollID);
      assert.strictEqual(insertPoint.toString(10), '2', errMsg); // after B
      await utils.as(alice, plcr.commitVote, pollID, secretHash, numTokens, insertPoint);

      // { A: 1, B: 5, C: 10 }

      receipt = await utils.as(alice, plcr.startPoll, 50, 100, 100);
      pollID = utils.getPollIDFromReceipt(receipt);
      secretHash = utils.createVoteHash(1, 420);
      numTokens = 3;
      insertPoint = await plcr.getInsertPointForNumTokens.call(alice, numTokens, pollID);
      assert.strictEqual(insertPoint.toString(10), '1', errMsg); // after A 
      await utils.as(alice, plcr.commitVote, pollID, secretHash, numTokens, insertPoint);

      // { A: 1, D: 3, B: 5, C: 10 }

      receipt = await utils.as(alice, plcr.startPoll, 50, 100, 100);
      pollID = utils.getPollIDFromReceipt(receipt);
      secretHash = utils.createVoteHash(1, 420);
      numTokens = 7;
      insertPoint = await plcr.getInsertPointForNumTokens.call(alice, numTokens, pollID);
      assert.strictEqual(insertPoint.toString(10), '2', errMsg); // after B 
      await utils.as(alice, plcr.commitVote, pollID, secretHash, numTokens, insertPoint);

      // { A: 1, D: 3, B: 5, E: 7, C: 10 }
    });

    describe('In-place updates for the first node in a list', () => {
      it('should return 0 for getInsertPoint when updating the starting node to a smaller value', async () => {
        // { A: 1, D: 3, B: 5, E: 7, C: 10 }
        // { 1: 1, 4: 3, 2: 5, 5: 7, 3: 10 }
        const errMsg = 'Did not get proper insertion point';
        const pollID = '1';

        await utils.as(alice, plcr.requestVotingRights, 50);

        const numTokens = 0;
        const insertPoint = await plcr.getInsertPointForNumTokens.call(alice, numTokens, pollID);
        assert.strictEqual(insertPoint.toString(10), '0', errMsg); // after root
      });

      it('should return 0 for getInsertPoint when updating the starting node to the same value', async () => {
        // { A: 1, D: 3, B: 5, E: 7, C: 10 }
        // { 1: 1, 4: 3, 2: 5, 5: 7, 3: 10 }
        const errMsg = 'Did not get proper insertion point';
        const pollID = '1';

        await utils.as(alice, plcr.requestVotingRights, 50);

        const numTokens = 1;
        const insertPoint = await plcr.getInsertPointForNumTokens.call(alice, numTokens, pollID);
        assert.strictEqual(insertPoint.toString(10), '0', errMsg); // after root
      });

      it('should return 0 for getInsertPoint when updating the starting node to a greater value', async () => {
        // { A: 1, D: 3, B: 5, E: 7, C: 10 }
        // { 1: 1, 4: 3, 2: 5, 5: 7, 3: 10 }
        const errMsg = 'Did not get proper insertion point';
        const pollID = '1';

        await utils.as(alice, plcr.requestVotingRights, 50);

        const numTokens = 2;
        const insertPoint = await plcr.getInsertPointForNumTokens.call(alice, numTokens, pollID);
        assert.strictEqual(insertPoint.toString(10), '0', errMsg); // after root
      });
    });

    describe('In-place updates for a middle node in a list', () => {
      it('should return 4 for getInsertPoint when updating a middle node to a smaller value', async () => {
        // { A: 1, D: 3, B: 5, E: 7, C: 10 }
        // { 1: 1, 4: 3, 2: 5, 5: 7, 3: 10 }
        const errMsg = 'Did not get proper insertion point';
        const pollID = '2';

        await utils.as(alice, plcr.requestVotingRights, 50);

        const numTokens = 4;
        const insertPoint = await plcr.getInsertPointForNumTokens.call(alice, numTokens, pollID);
        console.log(insertPoint.toString(10));
        assert.strictEqual(insertPoint.toString(10), '4', errMsg); // after D
      });

      it('should return 4 for getInsertPoint when updating a middle node to the same value', async () => {
        // { A: 1, D: 3, B: 5, E: 7, C: 10 }
        // { 1: 1, 4: 3, 2: 5, 5: 7, 3: 10 }
        const errMsg = 'Did not get proper insertion point';
        const pollID = '2';

        await utils.as(alice, plcr.requestVotingRights, 50);

        const numTokens = 5;
        const insertPoint = await plcr.getInsertPointForNumTokens.call(alice, numTokens, pollID);
        assert.strictEqual(insertPoint.toString(10), '4', errMsg); // after D
      });

      it('should return 4 for getInsertPoint when updating a middle node to a greater value', async () => {
        // { A: 1, D: 3, B: 5, E: 7, C: 10 }
        // { 1: 1, 4: 3, 2: 5, 5: 7, 3: 10 }
        const errMsg = 'Did not get proper insertion point';
        const pollID = '2';

        await utils.as(alice, plcr.requestVotingRights, 50);

        const numTokens = 6;
        const insertPoint = await plcr.getInsertPointForNumTokens.call(alice, numTokens, pollID);
        assert.strictEqual(insertPoint.toString(10), '4', errMsg); // after D
      });
    });

    describe('In-place updates for the last node in a list', () => {
      it('should return 5 for getInsertPoint when updating the last node to a smaller value', async () => {
        // { A: 1, D: 3, B: 5, E: 7, C: 10 }
        // { 1: 1, 4: 3, 2: 5, 5: 7, 3: 10 }
        const errMsg = 'Did not get proper insertion point';
        const pollID = '3';

        await utils.as(alice, plcr.requestVotingRights, 50);

        const numTokens = 9;
        const insertPoint = await plcr.getInsertPointForNumTokens.call(alice, numTokens, pollID);
        assert.strictEqual(insertPoint.toString(10), '5', errMsg); // after E
      });

      it('should return 5 for getInsertPoint when updating the last node to the same value', async () => {
        // { A: 1, D: 3, B: 5, E: 7, C: 10 }
        // { 1: 1, 4: 3, 2: 5, 5: 7, 3: 10 }
        const errMsg = 'Did not get proper insertion point';
        const pollID = '3';

        await utils.as(alice, plcr.requestVotingRights, 50);

        const numTokens = 10;
        const insertPoint = await plcr.getInsertPointForNumTokens.call(alice, numTokens, pollID);
        assert.strictEqual(insertPoint.toString(10), '5', errMsg); // after E
      });

      it('should return 5 for getInsertPoint when updating the last node to a greater value', async () => {
        // { A: 1, D: 3, B: 5, E: 7, C: 10 }
        // { 1: 1, 4: 3, 2: 5, 5: 7, 3: 10 }
        const errMsg = 'Did not get proper insertion point';
        const pollID = '3';

        await utils.as(alice, plcr.requestVotingRights, 50);

        const numTokens = 11;
        const insertPoint = await plcr.getInsertPointForNumTokens.call(alice, numTokens, pollID);
        assert.strictEqual(insertPoint.toString(10), '5', errMsg); // after E
      });
    });
  });
});

