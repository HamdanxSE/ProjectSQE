// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.27;

// TimeLock Contract
// This contract allows an owner to lock Ether until a specified unlock time and then withdraw it.
contract TimeLock {

    // The time when the funds can be withdrawn (in UNIX timestamp)
    uint public unlockTime; 
    
    // Owner of the contract, who can withdraw the funds
    address payable public owner; 
    
    // Flag to track if the withdrawal has already occurred
    bool private hasWithdrawn; 
    
    // Event emitted when the funds are successfully withdrawn
    event Withdrawal(uint amount, uint when);

    // Constructor to initialize the contract
    // Takes the unlock time as a parameter and also accepts Ether during deployment
    constructor(uint _unlockTime) payable {
        
        // Ensure that the unlock time is set in the future
        // This checks that the contract cannot be deployed with an unlock time in the past
        require(block.timestamp < _unlockTime, "Unlock time should be in the future");

        unlockTime = _unlockTime;  // Set the unlock time
        owner = payable(msg.sender); // Set the contract deployer as the owner
        hasWithdrawn = false;  // Initially, no withdrawal has occurred
    }

    // Withdraw function that allows the owner to withdraw funds after the unlock time
    function withdraw() public {
        
        // Check if the current time is equal to or greater than the unlock time
        // Prevents withdrawals before the unlock time
        require(block.timestamp >= unlockTime, "You can't withdraw yet");

        // Ensure that only the owner can call this function
        // Prevents non-owners from withdrawing the funds
        require(msg.sender == owner, "You aren't the owner");

        // Prevent multiple withdrawals after the funds have been taken
        // Ensures that funds are withdrawn only once
        require(!hasWithdrawn, "Funds have already been withdrawn");

        // Emit a withdrawal event with the amount and the time of the withdrawal
        emit Withdrawal(address(this).balance, block.timestamp);

        // Transfer the entire contract balance to the owner
        // The owner will receive the funds locked in the contract
        owner.transfer(address(this).balance);

        // Set the withdrawal flag to true, indicating funds have been withdrawn
        hasWithdrawn = true;
    }
}
