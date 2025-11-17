// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract RegistryContract {

    enum UserRole {
        UNREGISTERED,
        FARMER,
        BUYER,
        LOGISTICS_PROVIDER
    }

    // NEW: A dedicated struct for detailed profile information.
    struct UserProfile {
        string name;         // Farm Name, Company Name, etc.
        string location;     // City, State, etc.
        string contactInfo;  // Email, website, etc.
        string licenseOrId;  // Organic cert #, Business license #, etc.
    }

    struct User {
        address userAddress;
        UserRole role;
        bool isRegistered;
        UserProfile profile; // This now holds all the user's details.
    }

    mapping(address => User) public users;

    event UserRegistered(address indexed userAddress, UserRole role, string name);

    // UPDATED: The function now accepts the UserProfile struct.
    function registerUser(UserRole _role, UserProfile memory _profile) external {
        address caller = msg.sender;

        require(!users[caller].isRegistered, "User is already registered.");
        require(_role != UserRole.UNREGISTERED, "Cannot register with an UNREGISTERED role.");
        require(bytes(_profile.name).length > 0, "Name cannot be empty.");
        require(bytes(_profile.location).length > 0, "Location cannot be empty.");

        users[caller] = User({
            userAddress: caller,
            role: _role,
            isRegistered: true,
            profile: _profile
        });

        emit UserRegistered(caller, _role, _profile.name);
    }
}