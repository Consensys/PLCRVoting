/* eslint-env mocha */
/* global contract assert */

const BigNumber = require('bignumber.js');
const utils = require('./utils.js');

// Execute array of promises in sequence
const serial = funcs =>
  funcs.reduce(
    (promise, func) =>
      promise.then(result =>
        func().then(Array.prototype.concat.bind(result)),
      ),
    Promise.resolve([]),
  );

contract('PLCRVoting', (accounts) => {
  describe('Function: startPoll(uint _voteQuorum, uint _commitDuration, uint _revealDuration)', () => {
    const [alice] = accounts;
    it('should return a poll with ID 1 for the first poll created', async () => {
      const plcr = await utils.getPLCRInstance();
      const quorum = BigNumber(50);
      const commitDuration = BigNumber(100);
      const revealDuration = BigNumber(100);

      const receipt = await utils.as(
        alice,
        plcr.startPoll,
        quorum,
        commitDuration,
        revealDuration,
      );
      const pollID = utils.getPollIDFromReceipt(receipt);

      assert.isOk(
        pollID.eq(BigNumber(1)),
        'First poll returned ID not equal to 1',
      );
    });

    it('should correctly increment pollID when creating polls', async () => {
      const plcr = await utils.getPLCRInstance();
      const quorum = BigNumber(50);
      const commitDuration = BigNumber(100);
      const revealDuration = BigNumber(100);
      const initialPollNonce = await plcr.pollNonce.call();

      const expectedPollIDs = [
        initialPollNonce.add(BigNumber(1)),
        initialPollNonce.add(BigNumber(2)),
        initialPollNonce.add(BigNumber(3)),
        initialPollNonce.add(BigNumber(4)),
        initialPollNonce.add(BigNumber(5)),
      ];

      const pollStarters = expectedPollIDs.map(() => async () => {
        const receipt = await utils.as(
          alice,
          plcr.startPoll,
          quorum,
          commitDuration,
          revealDuration,
        );
        return utils.getPollIDFromReceipt(receipt);
      });

      const returnedPollIDs = await serial(pollStarters);

      const passExpectation = expectedPollIDs.filter((expectedPollId, i) =>
        expectedPollId.eq(returnedPollIDs[i]),
      );

      assert.equal(
        passExpectation.length,
        expectedPollIDs.length,
        'PollID not correctly incremented',
      );
    });

    it('should create a poll with a 50% vote quorum and 100 second commit/reveal durations', async () => {
      const plcr = await utils.getPLCRInstance();
      const expectedQuorum = BigNumber(50);
      const expectedCommitDuration = BigNumber(100);
      const expectedRevealDuration = BigNumber(100);

      const receipt = await utils.as(
        alice,
        plcr.startPoll,
        expectedQuorum,
        expectedCommitDuration,
        expectedRevealDuration,
      );
      const pollID = utils.getPollIDFromReceipt(receipt);

      const poll = await plcr.pollMap.call(pollID);
      const [
        returnedCommitEndDate,
        returnedRevealEndDate,
        returnedQuorum,
        /* eslint no-unused-vars: 0 */
        ...rest
        /* eslint no-unused-vars: 1 */
      ] = poll;

      const blockTimestamp = await utils.getBlockTimestamp();

      assert.isOk(
        expectedQuorum.eq(returnedQuorum),
        'Incorrect quorum for created poll',
      );
      assert.isOk(
        expectedCommitDuration.eq(
          returnedCommitEndDate.minus(BigNumber(blockTimestamp)),
        ),
        'Incorrect commit duration',
      );
      assert.isOk(
        expectedRevealDuration.eq(
          returnedRevealEndDate.minus(returnedCommitEndDate),
        ),
        'Incorrect commit duration',
      );
    });

    it(
      'should create a poll with a 60% vote quorum, a 100 second commit duration and ' +
        'a 200 second reveal duration',
      async () => {
        const plcr = await utils.getPLCRInstance();
        const expectedQuorum = BigNumber(60);
        const expectedCommitDuration = BigNumber(200);
        const expectedRevealDuration = BigNumber(200);

        const receipt = await utils.as(
          alice,
          plcr.startPoll,
          expectedQuorum,
          expectedCommitDuration,
          expectedRevealDuration,
        );
        const pollID = utils.getPollIDFromReceipt(receipt);

        const poll = await plcr.pollMap.call(pollID);
        const [
          returnedCommitEndDate,
          returnedRevealEndDate,
          returnedQuorum,
          /* eslint no-unused-vars: 0 */
          ...rest
          /* eslint no-unused-vars: 1 */
        ] = poll;

        const blockTimestamp = await utils.getBlockTimestamp();

        assert.isOk(
          expectedQuorum.eq(returnedQuorum),
          'Incorrect quorum for created poll',
        );
        assert.isOk(
          expectedCommitDuration.eq(
            returnedCommitEndDate.minus(BigNumber(blockTimestamp)),
          ),
          'Incorrect commit duration',
        );
        assert.isOk(
          expectedRevealDuration.eq(
            returnedRevealEndDate.minus(returnedCommitEndDate),
          ),
          'Incorrect commit duration',
        );
      },
    );
  });
});
