/* eslint-env mocha */
/* global contract assert */

const utils = require('./utils.js');

contract('PLCRVoting', (accounts) => {
  describe('Function: validPosition', () => {
    const [alice] = accounts;

    it('should affirm that a position is valid', async () => {
      const plcr = await utils.getPLCRInstance();
      const errMsg = 'Did not get proper insertion point';

      await utils.as(alice, plcr.requestVotingRights, 50);

      const receipt = await utils.as(alice, plcr.startPoll, 50, 100, 100);
      const pollID = utils.getPollIDFromReceipt(receipt);
      const secretHash = utils.createVoteHash(1, 420);
      const numTokens = 1;
      const insertPoint = await plcr.getInsertPointForNumTokens.call(alice, numTokens, pollID);
      assert(insertPoint.toString(10), '0', errMsg); // after root
      await utils.as(alice, plcr.commitVote, pollID, secretHash, numTokens, insertPoint);
    });

    it('should reject a position that is not valid', async () => {
      const plcr = await utils.getPLCRInstance();

      const receipt = await utils.as(alice, plcr.startPoll, 50, 100, 100);
      const pollID = utils.getPollIDFromReceipt(receipt);
      const secretHash = utils.createVoteHash(1, 420);
      const numTokens = 10;
      try {
        await utils.as(alice, plcr.commitVote, pollID, secretHash, numTokens, 0);
        assert(false, 'Alice was able to unsort her DLL');
      } catch (err) {
        assert(utils.isEVMException(err), err.toString());
      }
    });

    it('should reject a prevPollID that does not exist', async () => {
      const plcr = await utils.getPLCRInstance();

      const receipt = await utils.as(alice, plcr.startPoll, 50, 100, 100);
      const pollID = utils.getPollIDFromReceipt(receipt);
      const secretHash = utils.createVoteHash(1, 420);
      const numTokens = 0;
      try {
        await utils.as(alice, plcr.commitVote, pollID, secretHash, numTokens, 100);
        assert(false, 'Alice was able to unsort her DLL');
      } catch (err) {
        assert(utils.isEVMException(err), err.toString());
      }
    });
  });
});

