/* eslint-env mocha */
/* global contract assert artifacts */

const PLCRVoting = artifacts.require('./PLCRVoting.sol');
const PLCRFactory = artifacts.require('./PLCRFactory.sol');
const EIP20 = artifacts.require('tokens/eip20/EIP20.sol');

const utils = require('./utils.js');

contract('PLCRVoting', (accounts) => {
  describe('Function: requestVotingRights', () => {
    const [alice, bob] = accounts;
    let plcr;
    let token;

    before(async () => {
      const plcrFactory = await PLCRFactory.deployed();
      const factoryReceipt = await plcrFactory.newPLCRWithToken('1000', 'TestToken', '0', 'TEST');
      plcr = await PLCRVoting.at(factoryReceipt.logs[0].args.plcr);
      token = await EIP20.at(factoryReceipt.logs[0].args.token);

      await Promise.all(
        accounts.map(async (user) => {
          await token.transfer(user, 100);
          await token.approve(plcr.address, 100, { from: user });
        }),
      );
    });

    it('should grant voting rights for 10 tokens', async () => {
      await utils.as(alice, plcr.requestVotingRights, '10');

      const voteTokenBalance = await plcr.voteTokenBalance.call(alice);
      assert.strictEqual(voteTokenBalance.toString(10), '10',
        'Voting rights were not properly assigned');
    });

    it('should grant voting rights for 25 more tokens', async () => {
      await utils.as(alice, plcr.requestVotingRights, '25');

      const voteTokenBalance = await plcr.voteTokenBalance.call(alice);
      assert.strictEqual(voteTokenBalance.toString(10), '35',
        'Voting rights were not properly assigned');
    });

    it('should not grant voting rights for more tokens than the user has', async () => {
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

