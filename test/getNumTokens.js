/* eslint-env mocha */
/* global contract assert */

const utils = require('./utils.js');

contract('PLCRVoting', (accounts) => {
  describe('Function: getNumTokens', () => {
    const [alice] = accounts;
    it('should return the number of tokens committed by the voter for some pollID', async () => {
      const plcr = await utils.getPLCRInstance();
      const token = await utils.getERC20Token();
      const options = utils.defaultOptions();
      options.actor = alice;
      options.numTokens = '40';

      const startingBalance = await token.balanceOf.call(alice);
      const pollID = await utils.startPollAndCommitVote(options);

      const numTokens = await utils.as(alice, plcr.getNumTokens, alice, pollID);
      assert.strictEqual(
        numTokens.toString(10),
        '40',
        'should have 40 numTokens',
      );

      const endBalance = await token.balanceOf.call(alice);
      assert.strictEqual(
        endBalance.toString(10),
        startingBalance.sub(options.votingRights).toString(10),
        'should have 50 less tokens because of voting rights',
      );
    });
  });
});

