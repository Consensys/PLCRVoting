/* eslint-env mocha */
/* global contract assert */

const utils = require('./utils.js');
const BN = require('bignumber.js');

contract('PLCRVoting', (accounts) => {
  describe('Function: didReveal', () => {
    const [alice, bob] = accounts;

    it('should return true for a poll that a voter has revealed', async () => {
      const plcr = await utils.getPLCRInstance();
      const options = utils.defaultOptions();
      options.actor = alice;

      // alice commits
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

      // alice commits
      const pollID = await utils.startPollAndCommitVote(options);

      // didReveal(alice, pollID)
      const actual = await plcr.didReveal.call(options.actor, pollID.toString());
      const expected = false;
      assert.strictEqual(actual, expected, 'should have returned false because alice committed but did NOT reveal');
    });

    it('should return false for a poll that a voter has NOT committed NOR revealed', async () => {
      const plcr = await utils.getPLCRInstance();
      const options = utils.defaultOptions();
      options.actor = alice;

      // alice commits
      const pollID = await utils.startPollAndCommitVote(options);
      await utils.increaseTime(new BN(options.commitPeriod, 10).add(new BN('1', 10)).toNumber(10));

      // alice reveals
      await utils.as(options.actor, plcr.revealVote, pollID, options.vote, options.salt);

      // didReveal(bob, pollID)
      const actual = await plcr.didReveal.call(bob, pollID.toString());
      const expected = false;
      assert.strictEqual(actual, expected, 'should have returned false because bob did NOT reveal');
    });

    it('should revert for a poll that doesnt exist', async () => {
      const plcr = await utils.getPLCRInstance();
      const options = utils.defaultOptions();
      options.actor = alice;

      // alice commits
      const pollID = await utils.startPollAndCommitVote(options);
      await utils.increaseTime(new BN(options.commitPeriod, 10).add(new BN('1', 10)).toNumber(10));

      // alice reveals
      await utils.as(options.actor, plcr.revealVote, pollID, options.vote, options.salt);

      try {
        // didReveal(alice, pollID + 420420420)
        await plcr.didReveal.call(options.actor, pollID.add('420420420').toString());
      } catch (err) {
        assert(utils.isEVMException(err), err.toString());
        return;
      }
      assert(false, 'should not have been able to successfully call didReveal because the poll doesnt exists');
    });
  });
});
