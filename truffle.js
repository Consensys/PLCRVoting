const HDWalletProvider = require('truffle-hdwallet-provider');
const fs = require('fs');

// first read in the secrets.json to get our mnemonic
let secrets;
let mnemonic;
if (fs.existsSync('secrets.json')) {
  secrets = JSON.parse(fs.readFileSync('secrets.json', 'utf8'));
  mnemonic = secrets.mnemonic;
} else {
  console.log('no secrets.json found. You can only deploy to the testrpc.');
  mnemonic = '';
}

module.exports = {
  networks: {
    rinkeby: {
      provider: new HDWalletProvider(mnemonic, 'https://rinkeby.infura.io'),
      network_id: '*',
      gas: 6000000,
      gasPrice: 20000000000,
    },
    ropsten: {
      provider: new HDWalletProvider(mnemonic, 'https://ropsten.infura.io'),
      network_id: '*',
      gas: 4700000,
      gasPrice: 20000000000,
    },
    debug: {
      host: 'localhost',
      port: 8545,
      network_id: '*',
    },
    // config for solidity-coverage
    coverage: {
      host: 'localhost',
      network_id: '*',
      port: 7545, // <-- If you change this, also set the port option in .solcover.js.
      gas: 0xfffffffffff, // <-- Use this high gas value
      gasPrice: 0x01, // <-- Use this low gas price
    },
  },
};
