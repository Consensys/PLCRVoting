/* eslint-env mocha */
/* global contract assert */

const utils = require('./utils.js');
const BN = require('bignumber.js');

contract('PLCRVoting', (accounts) => {
  describe('Function: getNumPassingTokens', () => {
    const [alice] = accounts;
    describe('should correctly return the number of tokens that voted for the winning option', () => {
      it('voting for', async () => {
        const options = utils.defaultOptions();
        options.actor = alice;
        options.vote = '1';

        const plcr = await utils.getPLCRInstance();
        const pollID = await utils.startPollAndCommitVote(options);

        await utils.increaseTime(new BN(options.commitPeriod, 10).add(new BN('1', 10)).toNumber(10));

        await utils.as(options.actor, plcr.revealVote, pollID, options.vote, options.salt);

        await utils.increaseTime(new BN(options.revealPeriod, 10).add(new BN('1', 10)).toNumber(10));

        const passingTokens = await plcr.getNumPassingTokens
          .call(options.actor, pollID, options.salt);

        assert.strictEqual(passingTokens.toString(), options.numTokens,
          'number of winning tokens were not equal to commited tokens');
      });

      it('voting against', async () => {
        const options = utils.defaultOptions();
        options.actor = alice;
        options.vote = '0';

        const plcr = await utils.getPLCRInstance();
        const pollID = await utils.startPollAndCommitVote(options);

        await utils.increaseTime(new BN(options.commitPeriod, 10).add(new BN('1', 10)).toNumber(10));

        await utils.as(options.actor, plcr.revealVote, pollID, options.vote, options.salt);

        await utils.increaseTime(new BN(options.revealPeriod, 10).add(new BN('1', 10)).toNumber(10));

        const passingTokens = await plcr.getNumPassingTokens
          .call(options.actor, pollID, options.salt);

        assert.strictEqual(passingTokens.toString(), options.numTokens,
          'number of winning tokens were not equal to commited tokens');
      });
    });

    it('should fail if the poll queried has not yet ended');
    it('should fail if the voter queried has not yer revealed');
    it('should return 0 if the queried tokens were committed to the minority bloc');
  });
});

