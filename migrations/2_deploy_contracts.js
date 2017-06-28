var PLCRVoting = artifacts.require("./PLCRVoting.sol");
var fs = require("fs");

module.exports = function(deployer, network, accounts) {
	const utilConf = JSON.parse(fs.readFileSync("./conf/testUtilities.json"));

	var trustedAccounts = [];
	utilConf.trustedAccounts.forEach((idx) => trustedAccounts.push(accounts[idx]));

  	deployer.deploy(PLCRVoting, trustedAccounts);
};
