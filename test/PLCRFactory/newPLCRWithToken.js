/* eslint-env mocha */
/* global contract assert artifacts */

const PLCRFactory = artifacts.require('./PLCRFactory.sol');
const PLCRVoting = artifacts.require('./PLCRVoting.sol');

contract('PLCRFactory', (accounts) => {
  describe('Function: newPLCRWithToken', () => {
    let plcrFactory;

    before(async () => {
      plcrFactory = await PLCRFactory.deployed();
    });

    it('should deploy and initialize a new PLCRVoting contract and token', async () => {
      const tokenParams = {
        supply: '1000',
        name: 'TEST',
        decimals: '2',
        symbol: 'TST',
      };
      const receipt = await plcrFactory.newPLCRWithToken(tokenParams.name, tokenParams.symbol,
        tokenParams.decimals, tokenParams.supply);

      const creator = receipt.logs[0].args.creator;
      const token = receipt.logs[0].args.token;
      const plcr = PLCRVoting.at(receipt.logs[0].args.plcr);

      const plcrToken = await plcr.token.call();

      assert.strictEqual(creator, accounts[0], 'the creator emitted in the newPLCR event ' +
        'not correspond to the one which sent the creation transaction');
      assert.strictEqual(plcrToken, token, 'the token attached to the PLCR contract does ' +
        'not correspond to the one emitted in the newPLCR event');
    });
  });
});

