module.exports = {
  port: 8555,
  // only use a few accounts
  accounts: 10,
  // use the local version of truffle
  testCommand: '../node_modules/.bin/truffle test --network coverage -p 7545'
};
