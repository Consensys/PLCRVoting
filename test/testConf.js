require('./testHelpers.js')();
module.exports = function(accounts) {

    // import statements
    this.PLCRVoting = artifacts.require("./PLCRVoting.sol");
    this.HumanStandardToken = artifacts.require("./HumanStandardToken.sol");
    this.BN = require('bn.js');
    this.fs = require("fs");

    // constant variables
    [owner, ...user] = accounts; 
    this.owner = owner;
    this.user = user;
    this.commitDuration = 1000000; 
    this.revealDuration = 1000000;
    this.tokenAmt = 10;

    // regular expression to check for invalid opcode error
    this.re = new RegExp("(invalid opcode)","i");
};
