module.exports = function(accounts) {
    [owner, ...user] = accounts;

    // constant variables
    this.owner = owner;
    this.user = user;
    this.commitDuration = '1000000'; 
    this.revealDuration = '1000000';
    this.tokenAmt = 10;

    // import statements
    this.PLCRVoting = artifacts.require("./PLCRVoting.sol");
    this.HumanStandardToken = artifacts.require("./HumanStandardToken.sol");
    this.BN = require('bn.js');
    this.fs = require("fs");

    // regular expression to check for invalid opcode error
    this.re = new RegExp("(invalid opcode)","i");
};
