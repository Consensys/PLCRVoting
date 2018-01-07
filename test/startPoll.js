/* eslint-env mocha */
/* global contract assert */

const utils = require('./utils.js');
const BN = require('bignumber.js');

const bigTen = number => new BN(number.toString(10), 10);
const maxUint = bigTen(2).toPower(256).minus(1);

contract('PLCRVoting', (accounts) => {
  describe('Function: startPoll', () => {
    const [alice] = accounts;

    it('should return a poll with ID 1 for the first poll created');
    it('should return a poll with ID 5 for the fifth poll created');
    it('should create a poll with a 50% vote quorum and 100 second commit/reveal durations');
    it('should create a poll with a 60% vote quorum, a 100 second commit duration and ' +
       'a 200 second reveal duration');

    it('should not start poll with commitDuration that causes uint overflow', async () => {
      const plcr = await utils.getPLCRInstance();

      const voteQuorum = bigTen(50);
      const commitDuration = maxUint;
      const revealDuration = bigTen(600);

      try {
        await utils.as(alice, plcr.startPoll, voteQuorum, commitDuration, revealDuration);
        assert(false, 'Alice was able to start a poll with commitDuration that causes uint overflow');
      } catch (err) {
        assert(utils.isEVMException(err), err.toString());
      }
    });
  });
});
