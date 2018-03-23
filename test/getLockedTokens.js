/* eslint-env mocha */
/* global contract assert */

const utils = require('./utils.js');
const BN = require('bignumber.js');

contract('PLCRVoting', (accounts) => {
  const [alice] = accounts;

  describe('Function: getLockedTokens', () => {
    it('should return the number of tokens the user has locked in polls', async () => {
      const plcr = await utils.getPLCRInstance();
      const token = await utils.getERC20Token();
      const options = utils.defaultOptions(); // 20 tokens
      options.actor = alice;

      const startingBalance = await token.balanceOf.call(alice);
      const pollID = await utils.startPollAndCommitVote(options);
      await utils.increaseTime(new BN(options.commitPeriod, 10).add(new BN('1', 10)).toNumber(10));

      const middleBalance = await token.balanceOf.call(alice);
      const locked = await utils.as(alice, plcr.getLockedTokens, alice);
      assert.strictEqual(locked.toString(10), options.numTokens, 'Should have 20 tokens locked up');

      await utils.as(alice, plcr.revealVote, pollID, options.vote, options.salt);
      const notLocked = await utils.as(alice, plcr.getLockedTokens, alice);
      const finalBalance = await token.balanceOf.call(alice);

      assert.strictEqual(notLocked.toString(10), '0', 'Should have 0 tokens locked up');
      assert.strictEqual(startingBalance.sub(middleBalance).toString(10), options.votingRights,
        'Should have reduced by the default amount',
      );
      assert.strictEqual(middleBalance.toString(10), finalBalance.toString(10),
        'Should have the same balance even though alice revealed',
      );
    });
  });
});

