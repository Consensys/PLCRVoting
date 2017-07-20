const HDWalletProvider = require("truffle-hdwallet-provider")
const fs = require("fs")

// first read in the secrets.json to get our mnemonic
let secrets
let mnemonic
if(fs.existsSync("secrets.json")) {
    secrets = JSON.parse(fs.readFileSync("secrets.json", "utf8"))
    mnemonic = secrets.mnemonic
} else {
    console.log("no secrets.json found. You can only deploy to the testrpc.");
    mnemonic = "" 
}

module.exports = {
    networks: {
        development: {
            host: "localhost",
            port: 8545,
            network_id: "*" // Match any network id
        },
        rinkeby: {
            provider: new HDWalletProvider(mnemonic, "https://rinkeby.infura.io"),
            network_id: "*",
            gas: 4700000,
            gasPrice: 30000000000
        }
    }
};
