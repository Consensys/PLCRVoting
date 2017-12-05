/* eslint-env mocha */
/* global contract assert */

const utils = require('./utils.js');

contract('PLCRVoting', (accounts) => {
  describe('Function: withdrawVotingRights', () => {
    const [alice] = accounts;

    it('should withdraw voting rights for 10 tokens', async () => {
      const plcr = await utils.getPLCRInstance();
      await utils.as(alice, plcr.requestVotingRights, 11);
      await utils.as(alice, plcr.withdrawVotingRights, 10);
      const voteTokenBalance = await plcr.voteTokenBalance.call(alice);
      assert.strictEqual(voteTokenBalance.toNumber(10), 1,
        'Alice could not withdraw voting rights');
    });

    it('should fail when the user requests to withdraw more tokens than are available to them',
      async () => {
        const plcr = await utils.getPLCRInstance();
        const errMsg = 'Alice was able to withdraw more voting rights than she should have had';
        try {
          await utils.as(alice, plcr.withdrawVotingRights, 10);
          assert(false, errMsg);
        } catch (err) {
          assert(utils.isEVMException(err), err);
        }
        const voteTokenBalance = await plcr.voteTokenBalance.call(alice);
        assert.strictEqual(voteTokenBalance.toNumber(10), 1, errMsg);
      });

    it('should withdraw voting rights for all remaining tokens', async () => {
      const plcr = await utils.getPLCRInstance();
      await utils.as(alice, plcr.withdrawVotingRights, 1);
      const voteTokenBalance = await plcr.voteTokenBalance.call(alice);
      assert.strictEqual(voteTokenBalance.toNumber(10), 0,
        'Alice has voting rights when she should have none');
    });
  });
});

