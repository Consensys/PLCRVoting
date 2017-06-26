pragma solidity ^0.4.8;
import "./HumanStandardToken.sol";

contract PLCRVoting {
	
	struct Poll {
		uint commitEndDate;	 /// expiration date of commit period for 
		uint revealEndDate;	 /// expiration date of reveal period for 
		uint voteQuota;	 /// snapshot of canonical voteQ
		uint votesFor;	/// tally of votes supporting prop
		uint votesAgainst;	/// tally of votes countering proposal
	}
	// maps pollID to Poll struct
	mapping(uint => Poll) public pollMap; 

	mapping(bytes32 => uint) public voteMap;	

	uint commitDuration;	/// length of commit period
	uint revealDuration;	/// length of reveal period
	uint voteQuota;			/// type of majority necessary for winning poll
	address[] trusted;		/// list of trusted addresses

	bytes32 constant ZERO_NODE_COMMIT_HASH = 0xabc;

	function PLCRVoting(address tokenAddr) {
		token = HumanStandardToken(tokenAddr);
	}

	function commitVote(uint pollID, 
		bytes32 hashOfVoteAndSalt, uint numTokens, 
		uint prevPollID) 
		commitPeriodActive(pollID)
		returns (bool) {

		require(hasEnoughTokens(numTokens));
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

	

	/// maps user's address to voteToken balance
	mapping(address => uint) public voteTokenBalance;

	HumanStandardToken public token;

	// represent a double linked list through mapping
	// sha3(userAddress, pollID, "prevID") => byte32 prevID
	// sha3(userAddress, pollID, "nextID") => byte32 nextID
	// sha3(userAddress, pollID, "numTokens") => byte32 numTokens
	// sha3(userAddress, pollID, "commitHash") => byte32 commitHash

	/// interface for users to purchase votingTokens by exchanging ERC20 token
	function loadTokens(uint numTokens) {
		require(token.balanceOf(msg.sender) >= numTokens);
		require(token.transferFrom(msg.sender, this, numTokens));
		voteTokenBalance[msg.sender] += numTokens;
	}

	/// interface for users to withdraw votingTokens and exchange for ERC20 token
	function withdrawTokens(uint numTokens) {
		uint availableTokens = voteTokenBalance[msg.sender] - getMaxTokens();
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

		// delete node from double-linked-list by removing pointers to the node, and 
		// setting its prev and next to its own pollID
	function deleteNode(uint pollID){
		// get next and prev node pollIDs
		uint prevID = uint(getAttribute(pollID, "prevID"));
		uint nextID = uint(getAttribute(pollID, "nextID"));

		// remove node from list
		setAttribute(prevID, "nextID", nextID);
		setAttribute(nextID, "prevID", prevID);

		// set nodes prev and next to its own pollID
		setAttribute(pollID, "nextID", pollID); 
		setAttribute(pollID, "prevID", pollID); 
	}

		// return the pollID of the last node in a dll
	function getLastNode() returns (uint){
		return getAttribute(0, "prevID");
	}

	/*
	 *	Helper Functions
	 */

	// return max number of tokens locked for user
	function getMaxTokens() returns (uint) {
		return getAttribute(getLastNode(), "numTokens");
	}
	// return any attribute that is not commitHash
 
	function hasEnoughTokens(uint numTokens) returns (bool) {
		return voteTokenBalance[msg.sender] >= numTokens;
	}
	/*
	 *	Helper Functions
	 */
 
	// get any attribute that is not commitHash
	function getAttribute(uint pollID, string attrName) returns (uint) {
		return voteMap[sha3(msg.sender, pollID, attrName)];
	}

	function getCommitHash(uint pollID) returns (bytes32) {
		return bytes32(voteMap[sha3(msg.sender, pollID, "commitHash")]);
	}

	function setAttribute(uint pollID, string attrName, uint attrVal) {
		voteMap[sha3(msg.sender, pollID, attrName)] = attrVal;
	}

	/// MODIFIERS:
	/// true if the commit period is active (i.e. commit period expiration date not yet reached)
	modifier commitPeriodActive(uint pollID) {
		require(
			!isExpired(pollMap[pollID].commitEndDate)
		);
		_;
	}

	/// true if the reveal period is active (i.e. reveal period expiration date not yet reached)
	modifier revealPeriodActive(uint pollID) {
		require(
			!isExpired(pollMap[pollID].revealEndDate)
		);
		_;
	}

	/// true if the msg.sender (or tx.origin) is in the trusted list
	modifier isTrusted(address user) {
		_;
	}

	///HELPER FUNCTIONS:
	/// determines if current timestamp is past termination timestamp 
	function isExpired(uint terminationDate) returns (bool) {
		return (block.timestamp > terminationDate);
	}

	/// true if the poll ID corresponds to a valid poll; false otherwise
	function validPollID(uint pollID) returns (bool) {
		/// NOT YET IMPLEMENTED
	}
}
