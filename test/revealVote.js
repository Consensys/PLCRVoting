/* eslint-env mocha */
/* global contract assert */

const utils = require('./utils.js');

contract('PLCRVoting', (accounts) => {
  describe('Function: revealVote', () => {
    const [alice, bob] = accounts;
    it('should reveal a vote for a poll', async () => {
      const plcr = await utils.getPLCRInstance();
      const options = utils.defaultOptions();
      options.actor = alice;

      const pollID = await utils.startPollAndCommitVote(options);
      await utils.increaseTime(101); // commit period over. reveal period active.

      await utils.as(alice, plcr.revealVote, pollID, options.vote, options.salt);

      const votesFor = await utils.getVotesFor(pollID);
      assert.strictEqual(options.numTokens, votesFor.toString(10),
        'votesFor should be equal to numTokens');
    });

    it('should fail if the user has already revealed for this poll', async () => {
      const plcr = await utils.getPLCRInstance();
      const options = utils.defaultOptions();
      options.actor = alice;

      const pollID = '1';

      try {
        await utils.as(alice, plcr.revealVote, pollID, options.vote, options.salt);
        assert(false, 'should not have been able to reveal again');
      } catch (err) {
        assert(utils.isEVMException(err), err.toString());
      }

      const votesFor = await utils.getVotesFor(pollID);
      assert.strictEqual(options.numTokens, votesFor.toString(10),
        'votesFor should be equal to numTokens');
    });

    it('should fail if the provided salt or hash do not match those committed', async () => {
      const plcr = await utils.getPLCRInstance();
      const options = utils.defaultOptions();
      options.actor = bob;

      const pollID = await utils.startPollAndCommitVote(options);
      await utils.increaseTime(101); // commit period over. reveal period active.

      try {
        await utils.as(bob, plcr.revealVote, pollID, '0', options.salt);
        assert(false, 'should not have been able to reveal with a different vote option');
      } catch (err) {
        assert(utils.isEVMException(err), err.toString());
      }

      try {
        await utils.as(bob, plcr.revealVote, pollID, options.vote, '421');
        assert(false, 'should not have been able to reveal with a different salt');
      } catch (err) {
        assert(utils.isEVMException(err), err.toString());
      }
    });

    it('should fail if the reveal period is not active or the poll has ended', async () => {
      const plcr = await utils.getPLCRInstance();
      const options = utils.defaultOptions();
      options.actor = alice;

      // Fresh poll
      options.votingRights = '20';
      const newPollID = await utils.startPollAndCommitVote(options);

      // reveal period is not active yet
      const revealPeriodActive = await plcr.revealPeriodActive.call(newPollID);
      assert.strictEqual(revealPeriodActive, false, 'reveal period should NOT be active');

      try {
        await utils.as(alice, plcr.revealVote, newPollID, options.vote, options.salt);
        assert(false, 'should not have been able to reveal yet');
      } catch (err) {
        assert(utils.isEVMException(err), err.toString());
      }

      await utils.increaseTime(201);

      // Poll has already ended
      const pollID = '1';
      const pollEnded = await plcr.pollEnded.call(pollID);
      assert.strictEqual(pollEnded, true, 'poll should have ended.');

      try {
        await utils.as(alice, plcr.revealVote, pollID, options.vote, options.salt);
        assert(false, 'should not have been able to reveal after poll ended');
      } catch (err) {
        assert(utils.isEVMException(err), err.toString());
      }
    });

    it('should fail for polls which do not exist', async () => {
      const plcr = await utils.getPLCRInstance();

      try {
        await utils.as(alice, plcr.revealVote, '420', '1', '420');
      } catch (err) {
        assert(utils.isEVMException(err), err.toString());
        return;
      }
      assert.fail('Should not have been able to reveal for a non-existant poll');
    });
  });
});

