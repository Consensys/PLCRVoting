/* eslint-env mocha */
/* global contract assert */

const utils = require('./utils.js');

contract('PLCRVoting', (accounts) => {
  describe('Function: getNumPassingTokens', () => {
    const [alice, bob, cat, dog, elephant] = accounts;
    it('should return the number of tokens a voter committed in the winning bloc for a poll', async () => {
      const plcr = await utils.getPLCRInstance();
      const token = await utils.getERC20Token();
      const options = utils.defaultOptions();
      options.actor = alice;
      options.numTokens = '40';

      const startingBalance = await token.balanceOf.call(alice);
      const pollID = await utils.startPollAndCommitVote(options);

      await utils.increaseTime(101);

      const middleBalance = await token.balanceOf.call(alice);
      await utils.as(alice, plcr.revealVote, pollID, '1', options.salt);

      await utils.increaseTime(101);

      const npt = await utils.as(alice, plcr.getNumPassingTokens, alice, pollID, options.salt);
      // const finalBalance = await token.balanceOf.call(alice);
      assert.strictEqual(npt.toString(10), '40', 'alices numTokens should be the winner. no one else voted');
      assert.strictEqual(startingBalance.sub(middleBalance).toString(10),
        '50', 'Should have 50 votingRights',
      );
    });

    it('should fail if the poll queried has not yet ended', async () => {
      const plcr = await utils.getPLCRInstance();
      const token = await utils.getERC20Token();
      const options = utils.defaultOptions();
      options.actor = bob;

      const startingBalance = await token.balanceOf.call(bob);
      const pollID = await utils.startPollAndCommitVote(options);

      await utils.increaseTime(101);

      const middleBalance = await token.balanceOf.call(bob);
      await utils.as(bob, plcr.revealVote, pollID, options.vote, options.salt);

      try {
        await utils.as(bob, plcr.getNumPassingTokens, bob, pollID, options.salt);
        assert(false, 'should not have been able to getNumPassingTokens before poll has ended');
      } catch (err) {
        assert(utils.isEVMException(err), err.toString());
      }

      assert.strictEqual(
        startingBalance.sub(middleBalance).toString(10),
        '50', 'Should have 50 votingRights',
      );
    });

    it('should fail if the voter queried has not yer revealed', async () => {
      const plcr = await utils.getPLCRInstance();
      const token = await utils.getERC20Token();
      const options = utils.defaultOptions();
      options.actor = cat;

      const startingBalance = await token.balanceOf.call(cat);
      const pollID = await utils.startPollAndCommitVote(options);
      await utils.increaseTime(101);

      try {
        await utils.as(cat, plcr.getNumPassingTokens, cat, pollID, options.salt);
        assert(false, 'should not have been able to getNumPassingTokens before reveal');
      } catch (err) {
        assert(utils.isEVMException(err), err.toString());
      }

      const middleBalance = await token.balanceOf.call(cat);

      await utils.as(cat, plcr.revealVote, pollID, options.vote, options.salt);
      await utils.increaseTime(101);

      try {
        await utils.as(cat, plcr.getNumPassingTokens, cat, pollID, options.salt);
      } catch (err) {
        assert(false, 'should have been able to getNumPassingTokens after reveal');
      }

      assert.strictEqual(
        startingBalance.sub(middleBalance).toString(10),
        '50', 'Should have 50 votingRights',
      );
    });

    it('should return 0 if the queried tokens were committed to the minority bloc', async () => {
      const plcr = await utils.getPLCRInstance();
      const token = await utils.getERC20Token();

      // Dog options
      const options = utils.defaultOptions();
      options.actor = dog;
      options.vote = '1';
      options.numTokens = '20';
      const startingBalance = await token.balanceOf.call(dog);

      // Elephant options
      const elephantOptions = utils.defaultOptions();
      elephantOptions.actor = elephant;
      elephantOptions.vote = '0';
      elephantOptions.numTokens = '30';

      // Start poll as dog
      const pollID = await utils.startPollAndCommitVote(options);
      const middleBalance = await token.balanceOf.call(dog);

      // Commit vote as elephant
      await utils.commitVote(pollID, elephantOptions.vote,
        elephantOptions.numTokens, elephantOptions.salt, elephant);

      // Commit period ends / Reveal period begins
      await utils.increaseTime(101);

      // Reveal votes for both parties
      await utils.as(dog, plcr.revealVote, pollID, options.vote, options.salt);
      await utils.as(elephant, plcr.revealVote, pollID, elephantOptions.vote, elephantOptions.salt);

      // Reveal period ends
      await utils.increaseTime(101);

      const npt = await utils.as(dog, plcr.getNumPassingTokens, dog, pollID, options.salt);

      assert.strictEqual(
        npt.toString(10),
        '0',
        'should have returned zero since dog voted with less numTokens',
      );

      assert.strictEqual(
        startingBalance.sub(middleBalance).toString(10),
        '50', 'Should have 50 votingRights',
      );
    });
  });
});
