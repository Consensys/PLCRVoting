/* eslint-env mocha */
/* global contract assert artifacts */

const PLCRFactory = artifacts.require('./PLCRFactory.sol');
const PLCRVoting = artifacts.require('./PLCRVoting.sol');

contract('PLCRFactory', () => {
  describe('Malicious actions', () => {
    let plcrFactory;

    before(async () => {
      plcrFactory = await PLCRFactory.deployed();
    });

    it('should not overwrite storage in proxy PLCRs when storage is changed in the canonical ' +
      'PLCR contract', async () => {
      const canonizedPLCR = await PLCRVoting.at(await plcrFactory.canonizedPLCR.call());

      const tokenParams = {
        supply: '1000',
        name: 'TEST',
        decimals: '2',
        symbol: 'TST',
      };
      const receipt = await plcrFactory.newPLCRWithToken(tokenParams.supply, tokenParams.name,
        tokenParams.decimals, tokenParams.symbol);

      const token = receipt.logs[0].args.token;
      const plcr = await PLCRVoting.at(receipt.logs[0].args.plcr);

      await canonizedPLCR.init('0xdf9c10e2e9bb8968b908261d38860b1a038cc2ef');

      const plcrToken = await plcr.token.call();

      assert.strictEqual(plcrToken, token, 'the token attached to the PLCR contract does ' +
        'not correspond to the one emitted in the newPLCR event');
    });
  });
});

