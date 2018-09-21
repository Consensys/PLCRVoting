/* eslint-env mocha */
/* global contract assert artifacts */

const PLCRFactory = artifacts.require('./PLCRFactory.sol');
const PLCRVoting = artifacts.require('./PLCRVoting.sol');

contract('PLCRFactory', () => {
  describe('Malicious actions', () => {
    let plcrFactory;

    beforeEach(async () => {
      plcrFactory = await PLCRFactory.deployed();
    });

    it('should not overwrite storage in proxy PLCRs when storage is changed in the canonical ' +
      'PLCR contract', async () => {
      const canonizedPLCR = PLCRVoting.at(await plcrFactory.canonizedPLCR.call());
      const tokenParams = {
        supply: '10000000',
        name: 'TEST',
        decimals: '2',
        symbol: 'TST',
      };
      const receipt = await plcrFactory.newPLCRWithToken(tokenParams.name, tokenParams.symbol,
        tokenParams.decimals, tokenParams.supply);
      const token = receipt.logs[0].args.token;
      const plcr = PLCRVoting.at(receipt.logs[0].args.plcr);

      await canonizedPLCR.init(2666);

      const plcrToken = await plcr.token.call();

      assert.strictEqual(plcrToken, token, 'the token attached to the PLCR contract does ' +
        'not correspond to the one emitted in the newPLCR event');
    });
  });
});

