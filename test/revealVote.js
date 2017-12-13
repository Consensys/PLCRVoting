/* eslint-env mocha */
/* global contract assert */

const utils = require('./utils.js');
const BN = require('bignumber.js');

contract('PLCRVoting', (accounts) => {
  describe('Function: revealVote', () => {
    const [alice] = accounts;

    it('should reveal a vote for a poll', async () => {
      const plcr = await utils.getPLCRInstance();
      const options = utils.defaultOptions();
      options.actor = alice;

      const pollID = await utils.startPollAndCommitVote(options);

      await utils.increaseTime(new BN(options.commitPeriod, 10).add(new BN('1', 10)).toNumber(10));
      await utils.as(options.actor, plcr.revealVote, pollID, options.vote, options.salt);

      const votesFor = await utils.getVotesFor(pollID);
      const errMsg = 'votesFor should be equal to numTokens';
      assert.strictEqual(options.numTokens, votesFor.toString(10), errMsg);
    });

    it('should fail if the user has already revealed for some poll', async () => {
      const plcr = await utils.getPLCRInstance();
      const options = utils.defaultOptions();
      options.actor = alice;

      const pollID = '1';

      try {
        await utils.as(alice, plcr.revealVote, pollID, options.vote, options.salt);
      } catch (err) {
        assert(utils.isEVMException(err), err.toString());

        const votesFor = await utils.getVotesFor(pollID);
        assert.strictEqual(options.numTokens, votesFor.toString(10),
          'votesFor should be equal to numTokens');
        return;
      }
      assert(false, 'the same vote was revealed twice');
    });

    it('should fail if the provided vote does not match that committed', async () => {
      const plcr = await utils.getPLCRInstance();
      const options = utils.defaultOptions();
      options.actor = alice;

      const pollID = await utils.startPollAndCommitVote(options);
      await utils.increaseTime(new BN(options.commitPeriod, 10).add(new BN('1', 10)).toNumber(10));

      try {
        await utils.as(options.actor, plcr.revealVote, pollID, options.vote.concat('1'),
          options.salt);
      } catch (err) {
        assert(utils.isEVMException(err), err.toString());
        return;
      }
      assert(false, 'should not have been able to reveal with a different vote option');
    });

    it('should fail if the provided salt does not match that committed', async () => {
      const plcr = await utils.getPLCRInstance();
      const options = utils.defaultOptions();
      options.actor = alice;

      const pollID = await utils.startPollAndCommitVote(options);
      await utils.increaseTime(new BN(options.commitPeriod, 10).add(new BN('1', 10)).toNumber(10));

      try {
        await utils.as(options.actor, plcr.revealVote, pollID, options.vote,
          options.salt.concat('1'));
      } catch (err) {
        assert(utils.isEVMException(err), err.toString());
        return;
      }
      assert(false, 'should not have been able to reveal with a different salt');
    });

    it('should fail if the reveal period has not begun', async () => {
      const plcr = await utils.getPLCRInstance();
      const options = utils.defaultOptions();
      options.actor = alice;

      const pollID = await utils.startPollAndCommitVote(options);

      try {
        await utils.as(alice, plcr.revealVote, pollID, options.vote, options.salt);
      } catch (err) {
        assert(utils.isEVMException(err), err.toString());
        return;
      }
      assert(false, 'should not have been able to reveal early');
    });

    it('should fail if the reveal period has ended', async () => {
      const plcr = await utils.getPLCRInstance();
      const options = utils.defaultOptions();
      options.actor = alice;

      const pollID = await utils.startPollAndCommitVote(options);
      await utils.increaseTime(new BN(options.commitPeriod, 10).toNumber(10));
      await utils.increaseTime(new BN(options.revealPeriod).add(new BN('1', 10)).toNumber(10));

      const pollEnded = await plcr.pollEnded.call(pollID);
      assert.strictEqual(pollEnded, true, 'poll should have ended.');

      try {
        await utils.as(alice, plcr.revealVote, pollID, options.vote, options.salt);
      } catch (err) {
        assert(utils.isEVMException(err), err.toString());
        return;
      }
      assert(false, 'should not have been able to reveal after poll ended');
    });

    it('should fail for polls which do not exist', async () => {
      const plcr = await utils.getPLCRInstance();
      const options = utils.defaultOptions();
      options.actor = alice;

      try {
        await utils.as(options.actor, plcr.revealVote, '420', options.vote, options.salt);
      } catch (err) {
        assert(utils.isEVMException(err), err.toString());
        return;
      }
      assert(false, 'Should not have been able to reveal for a non-existant poll');
    });
  });
});

