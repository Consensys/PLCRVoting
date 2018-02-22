/* eslint-env mocha */
/* global contract */

const utils = require('./utils.js');

contract('PLCRVoting', (accounts) => {
  describe('Function: getLastNode', () => {
    const [alice] = accounts;

    it('should return the poll for which the user has the greatest number of tokens committed',
      async () => {
        const errMsg = 'Alice could not retreive the correct last node';
        const plcr = await utils.getPLCRInstance();
        const options = utils.defaultOptions();
        options.actor = alice;

        let retreivedPollID;
        let highestVotePollID;

        // Alice commits only to one poll and retreives that node
        options.numTokens = '10';
        highestVotePollID = await utils.startPollAndCommitVote(options);
        retreivedPollID = await plcr.getLastNode.call(options.actor);
        assert.strictEqual(highestVotePollID.toString(10),
                           retreivedPollID.toString(10),
                           errMsg);

        // Alice commits to another poll but with less tokens than his first time
        options.numTokens = '5';
        await utils.startPollAndCommitVote(options);
        retreivedPollID = await plcr.getLastNode.call(options.actor);
        assert.strictEqual(highestVotePollID.toString(10),
                           retreivedPollID.toString(10),
                           errMsg);

        // Alice commits to another poll but with more tokens than his first time
        options.numTokens = '20';
        highestVotePollID = await utils.startPollAndCommitVote(options);
        retreivedPollID = await plcr.getLastNode.call(options.actor);
        assert.strictEqual(highestVotePollID.toString(10),
                           retreivedPollID.toString(10),
                           errMsg);
    });
  });
});
