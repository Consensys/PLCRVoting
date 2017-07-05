// CONTRACTS:
const VotingContract = artifacts.require("./PLCRVoting.sol");
const TokenContract = artifacts.require("./HumanStandardToken.sol");

// NODE VARS:
const fs = require("fs");

module.exports = (deployer, network, accounts) => {
    let tokenConf = JSON.parse(fs.readFileSync('./conf/testToken.json'));
    let utilConf = JSON.parse(fs.readFileSync("./conf/testUtilities.json"));
    var trustedAccounts = [];
    utilConf.trustedAccounts.forEach((idx) => trustedAccounts.push(accounts[idx]));

    deployer.deploy(
        TokenContract,
        tokenConf.initialAmount,
        tokenConf.tokenName,
        tokenConf.decimalUnits,
        tokenConf.tokenSymbol
    )
    .then(() => deployer.deploy(
        VotingContract, 
        TokenContract.address, 
        trustedAccounts
    ));
}
