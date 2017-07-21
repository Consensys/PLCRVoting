pragma solidity^0.4.11;

library ASCSDLL {
    struct Data {
        mapping(bytes32 => uint) store;

        bytes32[] attrNames;
        uint sortAttrIdx;
    }

    function setOptions(Data storage self, bytes32[] _attrNames, uint _sortAttrIdx) {
        self.attrNames = _attrNames;
        self.sortAttrIdx = _sortAttrIdx;
    }

    function getAttr(Data storage self, uint curr, bytes32 attrName) returns (uint) {
        return self.store[sha3(msg.sender, curr, attrName)];
    }

    function setAttr(Data storage self, uint curr, bytes32 attrName, uint attrVal) {
        self.store[sha3(msg.sender, curr, attrName)] = attrVal;
    }

    function getNext(Data storage self, uint curr) returns (uint) {
        return getAttr(self, curr, "next");
    }

    function getPrev(Data storage self, uint curr) returns (uint) {
        return getAttr(self, curr, "prev");
    }

    function insert(Data storage self, uint prev, uint id, uint[] attrVals) {
        require(self.attrNames.length == attrVals.length);

        // if next is equal to id, thus id is being updated,
        // assign next to one node further
        uint next = getNext(self, prev);
        next = (next == id) ? getNext(self, id) : next;

        require(validatePosition(self, prev, next, attrVals[self.sortAttrIdx]));

        // set next node's prev attribute to new node id
        setAttr(self, next, "prev", id);

        // set prev node's next attribute to new node id
        setAttr(self, prev, "next", id);

        // make new node point to prev and next
        setAttr(self, id, "prev", prev);
        setAttr(self, id, "next", next);

        // set additional attributes of new node
        for(uint idx = 0; idx < self.attrNames.length; idx++) {
            setAttr(self, id, self.attrNames[idx], attrVals[idx]);
        }
    }
    
    /// validate position of curr given prev and its sort attribute value
    function validatePosition(Data storage self, uint prev, uint next, uint sortAttrVal) returns (bool valid) {
        // get prev and next sort attribute values to check for position
        uint prevSortAttrVal = getAttr(self, prev, self.attrNames[self.sortAttrIdx]);
        uint nextSortAttrVal = getAttr(self, next, self.attrNames[self.sortAttrIdx]);

        // make sure sort attribute value of curr is in order with adjacent nodes
        if ((prevSortAttrVal <= sortAttrVal) && ((sortAttrVal <= nextSortAttrVal) || next == 0)) {
            return true;
        }
        return false;
    }

    /// removes curr nodes's links from list but preserves its data
    function remove(Data storage self, uint curr) {
        uint prev = getPrev(self, curr);
        uint next = getNext(self, curr);

        setAttr(self, prev, "next", next);
        setAttr(self, next, "prev", prev);

        setAttr(self, curr, "next", curr);
        setAttr(self, curr, "prev", curr);
    }

    /// deletes nodes attribute data
    function reset(Data storage self, uint curr) {
        remove(self, curr);

        // reset additional attributes of node
        for(uint idx = 0; idx < self.attrNames.length; idx++) {
            setAttr(self, curr, self.attrNames[idx], 0);
        }
    }
}
