/* eslint-env mocha */
/* global contract assert */

const BigNumber = require('bignumber.js');
const utils = require('./utils.js');

contract('PLCRVoting', (accounts) => {
  describe('Property: mapping(address => uint) voteTokenBalance', () => {
    const [alice] = accounts;
    it('should return the correct vote token balance for some address', async () => {
      const numVoteTokens = BigNumber(10);
      const plcr = await utils.getPLCRInstance();

      // Assert initial value is 0
      const initialVoteTokenBalance = await plcr.voteTokenBalance.call(alice);
      assert.isOk(
        BigNumber(0).eq(initialVoteTokenBalance),
        'Vote token balance has incorrect value',
      );

      await utils.as(alice, plcr.requestVotingRights, numVoteTokens);

      // Assert new value == 10
      const voteTokenBalance = await plcr.voteTokenBalance.call(alice);
      assert.isOk(
        numVoteTokens.eq(voteTokenBalance),
        'Vote token balance has incorrect value',
      );
    });
  });
});
