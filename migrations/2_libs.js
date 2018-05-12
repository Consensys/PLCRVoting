/* global artifacts */

const DLL = artifacts.require('./DLL.sol');
const AttributeStore = artifacts.require('./AttributeStore.sol');

module.exports = (deployer) => {
  // deploy libraries
  deployer.deploy(DLL);
  deployer.deploy(AttributeStore);
};

