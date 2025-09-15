// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CounterL1 {
    uint256 public count;

    function inc() external {
        count++;
    }
}
