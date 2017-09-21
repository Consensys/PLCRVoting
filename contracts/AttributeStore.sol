pragma solidity^0.4.11;

library AttributeStore {
    struct Data {
        mapping(bytes32 => uint) store;
    }

    function getAttribute(Data storage self, bytes32 _UUID, string _attrName) returns (uint) {
        bytes32 key = sha3(_UUID, _attrName);
        return self.store[key];
    }

    function attachAttribute(Data storage self, bytes32 _UUID, string _attrName, uint _attrVal) {
        bytes32 key = sha3(_UUID, _attrName);
        self.store[key] = _attrVal;
    }
}
