# Partial-Lock Commit-Reveal Voting

[ ![Codeship Status for ConsenSys/PLCRVoting](https://app.codeship.com/projects/e58babc0-7647-0135-1b40-3a2518fac0ae/status?branch=master)](https://app.codeship.com/projects/244454)

[Detailed walkthrough](https://medium.com/metax-publication/a-walkthrough-of-plcr-voting-in-solidity-92420bd5b87c)

Mainnet factory: [0xdf9c10e2e9bb8968b908261d38860b1a038cc2ef](https://etherscan.io/address/0xdf9c10e2e9bb8968b908261d38860b1a038cc2ef#code)

Rinkeby factory: [0x5edd7268c6a0d2f171789d8385e95cdbb16ab735](https://rinkeby.etherscan.io/address/0x5edd7268c6a0d2f171789d8385e95cdbb16ab735#code)

EPM: [plcr-revival](https://www.ethpm.com/registry/packages/49)

## Summary

PLCR voting an an efficient system for token-weighted voting on the Ethereum blockchain

PLCR voting enables a user to participate in **multiple polls simultaneously** with their tokens while preventing double-voting of tokens within polls

PLCR voting allows users to withdraw (at any time) the maximum number of tokens which are not actively used voting

PLCR voting (in it's current implementation) **does not stake tokens** -- voting in the losing party of a poll does not result in a loss of one's tokens

---

## Core terminology / variables

**voting rights**: tokens controlled by the voting contract; either active or available to be used in PLCR voting

**commit-reveal**: voting takes place in 2 separate chronologic time periods. this prevents the voting process itself from influencing vote results

* **commit stage**: time period where a user can submit a secret token-weighted vote, locking those tokens. committed votes are concealed using a [**salted hash**](https://en.wikipedia.org/wiki/Salt_%28cryptography%29) of (1) the user's vote option and (2) a random number
* **reveal stage**: time period where a user can unlock their secret vote, confirming the vote's token-weight and option

**locked tokens**: during a poll's commit stage, committed tokens are "locked" (not-withdrawable) until the user either (1) reveals their vote or (2) rescues their tokens (more on this later)

**partial-lock**: although committed tokens are locked, you are able to and are highly encouraged to use those same "locked" tokens to commit votes in multiple polls at the same time

**majority bloc**: the group of voters who voted with a greater aggregate number of tokens

**minority bloc**: the group of voters who voted with a lesser aggregate number of tokens

* note: the total number of locked tokens is equivalent to the greatest number of tokens that a user committed (in any poll) which have not been unlocked

**`voteTokenBalance`**: mapping of user addresses: voting rights

**`voteOption`**: voter's choice for (binary) dispute resolution. in token-curated registries, references the candidate (applicant)

* **`votesFor`**: represents tokens voted in **support** for the candidate
* **`votesAgainst`**: represents tokens voted in **opposition** to the candidate

---

## Core steps / general flow / pseudocode

1.  acquire voting contract's intrinsic token

1.  `plcr.startPoll(details)`: create a new poll and emit details about the poll to the network

    * note: if using a token-curated registry, `startPoll` is a message sent via `tcr.challenge(listing)`

1.  `token.approve(voting)`: approve the voting contract, setting an allowance and enabling ERC20 transactions with the voting contract

1.  `plcr.requestVotingRights(tokens)`: transfer tokens from the user to the voting contract, increasing the user's `voteTokenBalance` (voting rights). in order to be able to lock and unlock tokens during periods, the voting contract must have control over voting tokens

    * note: PLCRVoting v1.1 inlines `requestVotingRights(tokens - votingRights)` the `commitVote` function

1.  `plcr.commitVote(poll, secret, tokens)`: submit a secret token-weighted vote to a poll. the vote choice is hidden and submitted as a secret

1.  `plcr.revealVote(poll, keys)`: reveal the hidden contents of a committed vote. this confirms the secret commit's validity and increases the number of total votes toward the user's vote option

1.  `tcr.updateStatus(poll)`: ping the contract that initiated the poll. tally the `votesFor` and `votesAgainst`, resolve the challenge, and transfer tokens accordingly

    * if the applicant won, challenger is auto-transferred the challenge reward
    * if the applicant won, the challenge reward is added to the Listing's deposit stake, available to be withdrawn using `tcr.withdraw()`
    * voter reward is made available to be claimed
    * NOTICE: challenge reward is different from voter reward. challenge reward goes to either: the applicant or the challenger, and is equal to the special dispensation percentage \* staked deposit of the opponent (min deposit). voter reward goes to the majority bloc of voters who voted for a poll

1.  `tcr.claimReward(poll, key)`: claim reward tokens for voting with the winning side (the majority bloc of voters for that poll's ruling). increasing the user's `voteTokenBalance` (voting rights)

1.  `plcr.withdrawVotingRights(tokens)`: transfer tokens from the voting contract to the user, decreasing the user's `voteTokenBalance` (voting rights)

---

## Tools, tips, strategies, idiosyncrasies

#### Forget to reveal and locked your tokens?

* if you do not reveal a committed vote within the reveal stage (perhaps by forgetting to send the transaction or by losing the vote's salt key), you can still rescue and unlock those tokens by invoking `plcr.rescueTokens()`. those tokens will not count toward the poll's outcome, as the reveal stage must have ended by this point to proceed. they are unlocked and made available to be withdrawn if/when you desire to do so

#### Saving money & time

* PLCRVoting v1.1 supports multi-commit and multi-reveal. if you have more than 1 poll you wish to commit/reveal for, you can collect the values of the multiple votes and send the consolidated data in a single transaction

* since v1.1 requests voting rights within the `commitVote` function, you can save an additional tx by NOT calling `requestVotingRights`, and solely invoking `commitVote` with the maximum number of tokens you are willing to actively use (i.e. lock) for voting. TLDR: don't bother with `requestVotingRights`, just call `commitVote`

#### Things to be aware of

* during the commit stage: although users' vote options are hidden (using a random salt), the number of tokens with which the user voted in the poll is emitted with the transaction and available to other users

* a user can only have 1 valid commit per poll. a re-committed vote will effectively delete the former commit

* voting in polls does not risk losing voting rights. if you vote in the minority bloc of a poll, you do not lose any tokens. yes, PLCR voting (in it's current implementation) does not stake tokens!

#### Goals

**Tactical goal**: increase the number of tokens one owns

* vote in every poll, vote with the majority

**Strategic goal**: increase the value of those tokens one owns

* vote judiciously to make the system more valuable
