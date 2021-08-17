pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

contract Migrations {
    address public _owner;
    uint public _last_completed_migration;

    constructor() {
        _owner = msg.sender;
    }

    modifier restricted() {
        if (msg.sender == _owner) _;
    }

    function setCompleted(uint completed) public restricted {
        _last_completed_migration = completed;
    }

    function upgrade(address new_address) public restricted {
        Migrations upgraded = Migrations(new_address);
        upgraded.setCompleted(_last_completed_migration);
    }
}
