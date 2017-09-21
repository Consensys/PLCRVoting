pragma solidity^0.4.11;

library DLL {
	struct Node {
		uint next;
		uint prev;
	}

	struct Data {
		mapping(uint => Node) dll;
	}

	function getNext(Data storage self, uint _curr) returns (uint) {
		return self.dll[_curr].next;
	}

	function getPrev(Data storage self, uint _curr) returns (uint) {
		return self.dll[_curr].prev;
	}

	function insert(Data storage self, uint _prev, uint _curr, uint _next) {
		self.dll[_curr].prev = _prev;
		self.dll[_curr].next = _next;

		self.dll[_prev].next = _curr;
		self.dll[_next].prev = _curr;
	}

	function remove(Data storage self, uint _curr) {
		uint next = getNext(self, _curr);
		uint prev = getPrev(self, _curr);

		self.dll[next].prev = prev;
		self.dll[prev].next = next;

		self.dll[_curr].next = _curr;
		self.dll[_curr].prev = _curr;
	}
}