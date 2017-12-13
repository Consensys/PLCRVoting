/* eslint-env mocha */
/* global contract assert */

const utils = require('./utils.js');

contract('PLCRVoting', (accounts) => {
  describe('Function: requestVotingRights', () => {
    const [alice, bob] = accounts;

    it('should grant voting rights for 10 tokens', async () => {
      const plcr = await utils.getPLCRInstance();

      await utils.as(alice, plcr.requestVotingRights, '10');

      const voteTokenBalance = await plcr.voteTokenBalance.call(alice);
      assert.strictEqual(voteTokenBalance.toString(10), '10',
        'Voting rights were not properly assigned');
    });

    it('should grant voting rights for 25 more tokens', async () => {
      const plcr = await utils.getPLCRInstance();

      await utils.as(alice, plcr.requestVotingRights, '25');

      const voteTokenBalance = await plcr.voteTokenBalance.call(alice);
      assert.strictEqual(voteTokenBalance.toString(10), '35',
        'Voting rights were not properly assigned');
    });

    it('should not grant voting rights for more tokens than the user has', async () => {
      const plcr = await utils.getPLCRInstance();
      const errMsg = 'Alice was able to acquire more voting rights than she has tokens';

      try {
        await utils.as(alice, plcr.requestVotingRights, '1001');
      } catch (err) {
        assert(utils.isEVMException, err);

        const voteTokenBalance = await plcr.voteTokenBalance.call(alice);
        assert.strictEqual(voteTokenBalance.toString(10), '35', errMsg);
        return;
      }
      assert(false, errMsg);
    });

    it('should not grant voting rights for more tokens than the user has approved ' +
       'plcr for', async () => {
      const plcr = await utils.getPLCRInstance();
      const errMsg = 'Bob was able to acquire more voting rights than he had approved the PLCR for';

      try {
        await utils.as(bob, plcr.requestVotingRights, '901');
      } catch (err) {
        assert(utils.isEVMException, err);

        const voteTokenBalance = await plcr.voteTokenBalance.call(bob);
        assert.strictEqual(voteTokenBalance.toString(10), '0', errMsg);
        return;
      }
      assert(false, errMsg);
    });
  });
});

