/* eslint-env mocha */
/* global contract assert */

const utils = require('./utils.js');

contract('PLCRVoting', (accounts) => {
  describe('Function: getInsertPointForNumTokens', () => {
    const [alice] = accounts;

    it('should return the correct insert point for a new node in a DLL', async () => {
      // Create { A: 1, B: 5, C: 10 }
      // Then insert { A: 1, D: 3, B: 5, C: 10 }
      // And then { A: 1, D: 3, B: 5, E: 7, C: 10 }
      const plcr = await utils.getPLCRInstance();
      const errMsg = 'Did not get proper insertion point';

      await utils.as(alice, plcr.requestVotingRights, 50);

      let receipt = await utils.as(alice, plcr.startPoll, 50, 100, 100);
      let pollID = utils.getPollIDFromReceipt(receipt);
      let secretHash = utils.createVoteHash(1, 420);
      let numTokens = 1;
      let insertPoint = await plcr.getInsertPointForNumTokens.call(alice, numTokens);
      assert(insertPoint.toString(10), '0', errMsg); // after root
      await utils.as(alice, plcr.commitVote, pollID, secretHash, numTokens, insertPoint);

      // { A: 1 }

      receipt = await utils.as(alice, plcr.startPoll, 50, 100, 100);
      pollID = utils.getPollIDFromReceipt(receipt);
      secretHash = utils.createVoteHash(1, 420);
      numTokens = 5;
      insertPoint = await plcr.getInsertPointForNumTokens.call(alice, numTokens);
      assert(insertPoint.toString(10), '1', errMsg); // after A
      await utils.as(alice, plcr.commitVote, pollID, secretHash, numTokens, insertPoint);

      // { A: 1, B: 5 }

      receipt = await utils.as(alice, plcr.startPoll, 50, 100, 100);
      pollID = utils.getPollIDFromReceipt(receipt);
      secretHash = utils.createVoteHash(1, 420);
      numTokens = 10;
      insertPoint = await plcr.getInsertPointForNumTokens.call(alice, numTokens);
      assert(insertPoint.toString(10), '2', errMsg); // after B
      await utils.as(alice, plcr.commitVote, pollID, secretHash, numTokens, insertPoint);

      // { A: 1, B: 5, C: 10 }

      receipt = await utils.as(alice, plcr.startPoll, 50, 100, 100);
      pollID = utils.getPollIDFromReceipt(receipt);
      secretHash = utils.createVoteHash(1, 420);
      numTokens = 3;
      insertPoint = await plcr.getInsertPointForNumTokens.call(alice, numTokens);
      assert(insertPoint.toString(10), '1', errMsg); // after A 
      await utils.as(alice, plcr.commitVote, pollID, secretHash, numTokens, insertPoint);

      // { A: 1, D: 3, B: 5, C: 10 }

      receipt = await utils.as(alice, plcr.startPoll, 50, 100, 100);
      pollID = utils.getPollIDFromReceipt(receipt);
      secretHash = utils.createVoteHash(1, 420);
      numTokens = 7;
      insertPoint = await plcr.getInsertPointForNumTokens.call(alice, numTokens);
      assert(insertPoint.toString(10), '2', errMsg); // after B 
      await utils.as(alice, plcr.commitVote, pollID, secretHash, numTokens, insertPoint);

      // { A: 1, D: 3, B: 5, E: 7, C: 10 }
    });
  });
});

