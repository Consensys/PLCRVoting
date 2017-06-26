pragma solidity ^0.4.4;

contract PLCRVoting {
	struct Poll {
		uint commitEndDate; /// expiration date of commit period for poll
		uint revealEndDate; /// expiration date of reveal period for poll
		uint voteQuota;		/// snapshot of canonical voteQuota
		uint votesFor;		/// tally of votes supporting proposal
		uint votesAgainst;  /// tally of votes countering proposal
	}

	/// maps pollID to Poll struct
	mapping(uint => Poll) pollMap; 

	/// maps hash of user's address and pollID to VoteNode struct
	mapping(bytes32 => uint) voteMap;  

	uint commitDuration;	/// length of commit period
	uint revealDuration;	/// length of reveal period
	uint voteQuota;			/// type of majority necessary for winning poll
	address[] trusted;		/// list of trusted addresses

	bytes32 constant ZERO_NODE_COMMIT_HASH = 0xabc;


        function commitVote(uint pollID, 
		bytes32 hashOfVoteAndSalt, uint numTokens, 
		uint prevPollID) hasEnoughTokens(numTokens) 
		commitPeriodActive(pollID)
		returns (bool) {

		// Make sure user is not trying to manually commit
		// a vote corresponding the zero node
		require(pollID != 0);

		// Check to see if we are making an update
		// as opposed to an insert
		bool isUpdatingExistingNode = false;
		if (pollID == prevPollID) {
			// Making an update --> the previous node
			// has already been set, and so that
			// node can be used for validation
			prevPollID = getPreviousID(pollID);

			// Check to see if the previous poll ID was not set,
			// which would imply that poll ID can not be valid
			if (prevPollID == 0) {
				return false;
			}

			isUpdatingExistingNode = true;
		} 

		// Determine if the new node can be inserted/updated
		// at the given spot (i.e. the node right after prevPollID)
		bool isValid = validateNode(prevPollID, numTokens);

		// Node is valid
		if (isValid) {
			uint hashAsInt = uint(hashOfVoteAndSalt);
			// Update a previous commit
			if (isUpdatingExistingNode) {
				/*
					TODO: Update the <node at poll ID>:
						update numTokens attribute
						update commitHash attribute
				*/
			} else {
				/*
					TODO: insert the <node at poll ID> after
					the node at <prevPollID>:

				*/

				// Check if the zero node is the only node
				// in the double-linked list
				if (prevPollID == 0 
					&& getNextID(prevPollID) == 0) {
					/*
						TODO: insert the >node at poll ID> after
						the zero node 
					*/
				}
			}
		}

		// Invalid prevPollID
		return false;
	}

	function validateNode(uint prevPollID, uint256 numTokens) returns (bool) {
		if (prevPollID == 0 
			&& getNextID(prevPollID) == 0) {
			// Only the zero node exists
			return true;
		}

		uint256 prevNodeTokens = getNumTokens(prevPollID);
		// Check if the potential previous node has
		// less tokens than the current node
		if (prevNodeTokens <= numTokens) {
			uint256 nextNodeID = getNextID(prevPollID);
			uint256 nextNodeTokens = getNumTokens(nextNodeID);
			if (getCommitHash(nextNodeID) == ZERO_NODE_COMMIT_HASH
				|| numTokens <= nextNodeTokens) {
				return true;
			} 
		}

		return false;
	}

	function getPreviousID(uint pollID) returns (uint) {
		return uint(getAttribute(pollID, "prevID"));
	}

	function getNextID(uint pollID) returns (uint) {
		return uint(getAttribute(pollID, "nextID"));
	}

	function getNumTokens(uint pollID) returns (uint256) {
		return uint(getAttribute(pollID, "numTokens"));
	}

	

  // maps pollID to Poll struct
  mapping(uint => Poll) public pollMap; 

  /// maps user's address to voteToken balance
  mapping(address => uint) public voteTokenBalance;

  HumanStandardToken public token;

  // represent a double linked list through mapping
  // sha3(userAddress, pollID, "prevID") => byte32 prevID
  // sha3(userAddress, pollID, "nextID") => byte32 nextID
  // sha3(userAddress, pollID, "numTokens") => byte32 numTokens
  // sha3(userAddress, pollID, "commitHash") => byte32 commitHash
  mapping(bytes32 => uint) public voteMap;  

  function PLCRVoting(address tokenAddr) {
    token = HumanStandardToken(tokenAddr);
  }

  /// interface for users to purchase votingTokens by exchanging ERC20 token
  function loadTokens(uint numTokens) {
    require(token.balanceOf(msg.sender) >= numTokens);
    require(token.transferFrom(msg.sender, this, numTokens));
    voteTokenBalance[msg.sender] += numTokens;
  }

  /// interface for users to withdraw votingTokens and exchange for ERC20 token
  function withdrawTokens(uint numTokens) {
    uint availableTokens = voteTokenBalance[msg.sender] - getMaxVoted(msg.sender);
    require(availableTokens >= numTokens);
    require(token.transfer(msg.sender, numTokens));
    voteTokenBalance[msg.sender] -= numTokens;
  }
  
  // insert to double-linked-list given that the prevID is valid
  function insertToDll(uint pollID, uint prevID, uint numTokens, bytes32 commitHash){
    uint nextID = uint(getAttribute(prevID, "nextID"));

    // make nextNode.prev point to newNode
    setAttribute(nextID, "prevID", pollID);

    // make prevNode.next point to newNode
    setAttribute(prevID, "nextID", pollID);

    // make newNode point to next and prev 
    setAttribute(pollID, "prevID", prevID); 
    setAttribute(pollID, "nextID", nextID); 

    // set properties of newNode
    setAttribute(pollID, "numTokens", numTokens);
    setAttribute(pollID, "commitHash", uint(commitHash));
  }  

  /*
   *  Helper Functions
   */
 
  function hasEnoughTokens(uint numTokens) returns (bool) {
  	return voteTokenMap[msg.sender] >= numTokens;
  }

  // get any attribute that is not commitHash
  function getAttribute(uint pollID, string attrName) returns (uint) {
    return voteMap[sha3(msg.sender, pollID, attrName)];
  }

  function getCommitHash(uint pollID) returns (bytes32) {
    return bytes32(voteMap[sha3(msg.sender, pollID, 'commitHash')]);
  }

  function setAttribute(uint pollID, string attrName, uint attrVal) {
    voteMap[sha3(msg.sender, pollID, attrName)] = attrVal;
  }

  function getMaxVoted(address user) returns (uint) {
    user = user;
    return 0; //just for testing
  }
}
