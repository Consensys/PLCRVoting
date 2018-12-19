/* global artifacts */

const PLCRFactory = artifacts.require('./PLCRFactory.sol');
const DLL = artifacts.require('dll/DLL.sol');
const AttributeStore = artifacts.require('attrstore/AttributeStore.sol');

module.exports = async (deployer) => {
  // deploy libraries
  await deployer.deploy(DLL);
  await deployer.deploy(AttributeStore);

  // link libraries
  await deployer.link(DLL, PLCRFactory);
  await deployer.link(AttributeStore, PLCRFactory);

  await deployer.deploy(PLCRFactory);
};
