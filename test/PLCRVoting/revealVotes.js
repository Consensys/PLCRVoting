/* eslint-env mocha */
/* global contract assert artifacts */

const PLCRVoting = artifacts.require('./PLCRVoting.sol');
const PLCRFactory = artifacts.require('./PLCRFactory.sol');
const EIP20 = artifacts.require('tokens/eip20/EIP20.sol');

const utils = require('./utils.js');
const BN = require('bignumber.js');

contract('PLCRVoting', (accounts) => {
  describe('Function: revealVotes', () => {
    const [alice] = accounts;
    let plcr;
    let token;

    before(async () => {
      const plcrFactory = await PLCRFactory.deployed();
      const factoryReceipt = await plcrFactory.newPLCRWithToken('10000', 'TestToken', '0', 'TEST');
      plcr = PLCRVoting.at(factoryReceipt.logs[0].args.plcr);
      token = EIP20.at(factoryReceipt.logs[0].args.token);

      await Promise.all(
        accounts.map(async (user) => {
          await token.transfer(user, 1000);
          await token.approve(plcr.address, 1000, { from: user });
        }),
      );
    });

    it('should reveal an array of 1 vote', async () => {
      const options = utils.defaultOptions();
      options.actor = alice;

      const pollID = await utils.startPollAndCommitVote(options, plcr);

      const pollIDs = [pollID];
      const votes = [options.vote];
      const salts = [options.salt];

      await utils.increaseTime(new BN(options.commitPeriod, 10).add(new BN('1', 10)).toNumber(10));
      await utils.as(options.actor, plcr.revealVotes,
        pollIDs, votes, salts);

      const votesFor = await utils.getVotesFor(pollID, plcr);
      const errMsg = 'votesFor should be equal to numTokens';
      assert.strictEqual(options.numTokens, votesFor.toString(10), errMsg);
    });

    it('should reveal an array of 2 votes in 2 polls', async () => {
      const options1 = utils.defaultOptions();
      options1.actor = alice;
      options1.vote = '1';
      options1.salt = '420';
      const pollID1 = await utils.startPollAndCommitVote(options1, plcr);

      const options2 = utils.defaultOptions();
      options2.actor = alice;
      options2.vote = '1';
      options2.salt = '9001';
      const pollID2 = await utils.startPollAndCommitVote(options2, plcr);

      const pollIDs = [pollID1, pollID2];
      const votes = [options1.vote, options2.vote];
      const salts = [options1.salt, options2.salt];

      await utils.increaseTime(new BN(options1.commitPeriod, 10).add(new BN('1', 10)).toNumber(10));
      await utils.as(options1.actor, plcr.revealVotes,
        pollIDs, votes, salts);

      const errMsg = 'votesFor should be equal to numTokens';

      const votesFor1 = await utils.getVotesFor(pollID1, plcr);
      assert.strictEqual(options1.numTokens, votesFor1.toString(10), errMsg);

      const votesFor2 = await utils.getVotesFor(pollID2, plcr);
      assert.strictEqual(options2.numTokens, votesFor2.toString(10), errMsg);
    });
  });
});

