/* eslint-env mocha */
/* global contract assert artifacts */

const PLCRVoting = artifacts.require('./PLCRVoting.sol');
const PLCRFactory = artifacts.require('./PLCRFactory.sol');
const EIP20 = artifacts.require('tokens/eip20/EIP20.sol');

const utils = require('./utils.js');
const BN = require('bn.js');

contract('PLCRVoting', (accounts) => {
  describe('Function: getTotalNumberOfTokensForWinningOption', () => {
    const [alice] = accounts;
    let plcr;
    let token;

    before(async () => {
      const plcrFactory = await PLCRFactory.deployed();
      const receipt = await plcrFactory.newPLCRWithToken('10000', 'TestToken', '0', 'TEST');

      plcr = await PLCRVoting.at(receipt.logs[0].args.plcr);
      token = await EIP20.at(receipt.logs[0].args.token);

      await Promise.all(
        accounts.map(async (user) => {
          await token.transfer(user, 1000);
          await token.approve(plcr.address, 1000, { from: user });
        }),
      );
    });

    it('should return the total number of votes for if the poll passed', async () => {
      const options = utils.defaultOptions();
      options.actor = alice;
      options.vote = '1';

      // make a poll and commit and reveal a "for" vote
      const pollID = await utils.startPollAndCommitVote(options, plcr);
      await utils.increaseTime(new BN(options.commitPeriod, 10).add(new BN('1', 10)).toNumber(10));

      await utils.as(options.actor, plcr.revealVote, pollID, options.vote, options.salt);
      await utils.increaseTime(new BN(options.revealPeriod, 10).add(new BN('1', 10)).toNumber(10));

      // make sure poll passed
      const isPassed = await plcr.isPassed.call(pollID);
      assert.strictEqual(isPassed, true, 'poll has not passed!');

      // check the number of tokens
      // votesFor === tokens === options.numTokens
      const tokens = await plcr.getTotalNumberOfTokensForWinningOption.call(pollID);
      const votesFor = await utils.getVotesFor(pollID, plcr);

      assert.strictEqual(tokens.toString(), options.numTokens,
        'number of winning tokens were not equal to commited tokens');

      assert.strictEqual(tokens.toString(), votesFor.toString(),
        'number of winning tokens were not equal to tokens revealed for');
    });

    it('should return the total number of votes against if the poll did not pass', async () => {
      const options = utils.defaultOptions();
      options.actor = alice;
      options.vote = '0';

      // make a poll and commit and reveal an "against" vote
      const pollID = await utils.startPollAndCommitVote(options, plcr);
      await utils.increaseTime(new BN(options.commitPeriod, 10).add(new BN('1', 10)).toNumber(10));

      await utils.as(options.actor, plcr.revealVote, pollID, options.vote, options.salt);
      await utils.increaseTime(new BN(options.revealPeriod, 10).add(new BN('1', 10)).toNumber(10));

      // make sure poll did not pass
      const isPassed = await plcr.isPassed.call(pollID);
      assert.strictEqual(isPassed, false, 'poll has passed');

      // check the number of tokens
      // votesAgainst === tokens === options.numTokens
      const tokens = await plcr.getTotalNumberOfTokensForWinningOption.call(pollID);
      const votesAgainst = await utils.getVotesAgainst(pollID, plcr);

      assert.strictEqual(tokens.toString(), options.numTokens,
        'number of winning tokens were not equal to commited tokens');

      assert.strictEqual(tokens.toString(), votesAgainst.toString(),
        'number of winning tokens were not equal to tokens revealed against');
    });

    it('should fail if the poll has not yet ended', async () => {
      const options = utils.defaultOptions();
      options.actor = alice;
      options.vote = '1';

      // make a poll and commit a vote
      const pollID = await utils.startPollAndCommitVote(options, plcr);

      try {
        await plcr.getTotalNumberOfTokensForWinningOption.call(pollID);
      } catch (err) {
        assert(utils.isEVMException(err), err.toString());
        return;
      }
      assert(false,
        'was able to call getTotalNumberOfTokensForWinningOption when poll has not ended');
    });
  });
});

