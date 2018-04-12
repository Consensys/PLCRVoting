/* eslint-env mocha */
/* global contract assert */

const utils = require('./utils.js');
const BN = require('bignumber.js');

contract('PLCRVoting', (accounts) => {
  describe('Function: didReveal', () => {
    const [alice] = accounts;

    it('should return true for a poll that a voter has revealed', async () => {
      const plcr = await utils.getPLCRInstance();
      const options = utils.defaultOptions();
      options.actor = alice;

      // alice starts poll & commits
      const pollID = await utils.startPollAndCommitVote(options);
      await utils.increaseTime(new BN(options.commitPeriod, 10).add(new BN('1', 10)).toNumber(10));

      // alice reveals
      await utils.as(options.actor, plcr.revealVote, pollID, options.vote, options.salt);

      // didReveal(alice, pollID)
      const actual = await plcr.didReveal.call(options.actor, pollID.toString());
      const expected = true;
      assert.strictEqual(actual, expected, 'should have returned true because alice DID reveal');
    });

    it('should return false for a poll that a voter has committed but NOT revealed', async () => {
      const plcr = await utils.getPLCRInstance();
      const options = utils.defaultOptions();
      options.actor = alice;

      // alice starts poll & commits
      const pollID = await utils.startPollAndCommitVote(options);

      // didReveal(alice, pollID)
      const actual = await plcr.didReveal.call(options.actor, pollID.toString());
      const expected = false;
      assert.strictEqual(actual, expected, 'should have returned false because alice committed but did NOT reveal');
    });

    it('should return false for a poll that a voter has NEITHER committed NOR revealed', async () => {
      const plcr = await utils.getPLCRInstance();
      const options = utils.defaultOptions();

      // start poll
      const receipt = await plcr.startPoll(options.quorum,
        options.commitPeriod, options.revealPeriod);
      const pollID = utils.getPollIDFromReceipt(receipt);

      // didReveal(alice, pollID)
      const actual = await plcr.didReveal.call(alice, pollID.toString());
      const expected = false;
      assert.strictEqual(actual, expected, 'should have returned false because alice did NOT reveal');
    });

    it('should revert for a poll that doesnt exist', async () => {
      const plcr = await utils.getPLCRInstance();

      try {
        // didReveal(alice, 420420420)
        await plcr.didReveal.call(alice, '420420420');
      } catch (err) {
        assert(utils.isEVMException(err), err.toString());
        return;
      }
      assert(false, 'should not have been able to successfully call didReveal because the poll doesnt exists');
    });
  });
});
