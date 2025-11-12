// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title RegistryContract
 * @dev Manages user identities and roles for the AgriChain platform.
 * Allows users to register themselves with a specific role.
 */
 
contract RegistryContract {

    //===========
    // Data Types
    //===========

    // Define the possible roles for users on the platform.
    enum UserRole {
        UNREGISTERED,
        FARMER,
        BUYER,
        LOGISTICS_PROVIDER
    }

    // A structure to hold information about each registered user.
    struct User {
        address userAddress; // The user's unique wallet address.
        UserRole role;       // The role assigned to the user.
        bool isRegistered;   // A flag to quickly check if a user exists.
    }

    //===========
    // State Variables
    //===========

    // A mapping from a user's wallet address to their User struct.
    // This acts as our on-chain database of users.
    // `public` makes it automatically readable from outside the contract.
    mapping(address => User) public users;


    //===========
    // Events
    //===========

    // Emitted when a new user successfully registers.
    // Events are crucial for the frontend to listen to blockchain activities.
    event UserRegistered(address indexed userAddress, UserRole role);


    //===========
    // Functions
    //===========

    /**
     * @dev Registers a new user on the AgriChain platform.
     * The person calling the function (msg.sender) will be registered.
     * @param _role The role the user wants to register as (FARMER, BUYER, etc.).
     *
     * Requirements:
     * - The user must not already be registered.
     * - The chosen role cannot be UNREGISTERED.
     */
    function registerUser(UserRole _role) external {
        // `msg.sender` is a global variable in Solidity that holds
        // the wallet address of the person calling the function.
        address caller = msg.sender;

        // Requirement Check 1: Ensure the user is not already registered.
        // `require` statements check for conditions. If false, the transaction fails.
        require(!users[caller].isRegistered, "User is already registered.");

        // Requirement Check 2: Ensure the user chooses a valid role.
        require(_role != UserRole.UNREGISTERED, "Cannot register with an UNREGISTERED role.");

        // If both checks pass, create and save the new user.
        users[caller] = User({
            userAddress: caller,
            role: _role,
            isRegistered: true
        });

        // Emit an event to notify the outside world (our dApp) that this happened.
        emit UserRegistered(caller, _role);
    }
}