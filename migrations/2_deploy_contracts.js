/* global artifacts */

const PLCRVoting = artifacts.require('./PLCRVoting.sol');
const HumanStandardToken = artifacts.require('./HumanStandardToken.sol');
const DLL = artifacts.require('./DLL.sol');
const AttributeStore = artifacts.require('./AttributeStore.sol');

const fs = require('fs');

module.exports = (deployer, network, accounts) => {
  // deploy libraries
  deployer.deploy(DLL);
  deployer.deploy(AttributeStore);

  // link libraries
  deployer.link(DLL, PLCRVoting);
  deployer.link(AttributeStore, PLCRVoting);

  if (network === 'test') {
    const tokenConf = {
      initialAmount: '1000',
      tokenName: 'TestToken',
      decimalUnits: '0',
      tokenSymbol: 'TEST',
    };

    deployer.deploy(
      HumanStandardToken,
      tokenConf.initialAmount,
      tokenConf.tokenName,
      tokenConf.decimalUnits,
      tokenConf.tokenSymbol,
    )
      .then(() => deployer.deploy(
        PLCRVoting,
        HumanStandardToken.address,
      ))
      .then(async () => {
        const plcr = await PLCRVoting.deployed();
        const token = HumanStandardToken.at(await plcr.token.call());

        return Promise.all(
          accounts.map(async (user) => {
            await token.transfer(user, 100);
            await token.approve(plcr.address, 90, { from: user });
          }),
        );
      });
  } else {
    const conf = JSON.parse(fs.readFileSync('conf/config.json'));
    deployer.deploy(PLCRVoting, conf.token);
  }
};
