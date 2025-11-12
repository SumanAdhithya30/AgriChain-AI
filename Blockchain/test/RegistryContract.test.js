import { expect } from "chai";
import hre from "hardhat";

describe("RegistryContract", function () {
    // A 'describe' block is like a container for a group of related tests.

    let registry; // A variable to hold our deployed contract instance
    let owner;    // A variable for the wallet address that deploys the contract
    let user1;    // A variable for a test user address

    // This 'beforeEach' block runs before every single test ('it' block).
    // It's perfect for setting up a fresh contract state for each test.
    beforeEach(async function () {
        // Get some test accounts provided by Hardhat
        [owner, user1] = await hre.ethers.getSigners();

        // Get the contract factory for our RegistryContract
        const RegistryContractFactory = await hre.ethers.getContractFactory("RegistryContract");
        
        // Deploy a new instance of the contract
        registry = await RegistryContractFactory.deploy();
    });

    // Test case #1: It should allow a new user to register
    it("Should allow a new user to register with a valid role", async function () {
        // We will call the registerUser function from the user1 account.
        // The role `1` corresponds to `FARMER` in our enum (0=UNREGISTERED, 1=FARMER, etc.)
        await registry.connect(user1).registerUser(1);

        // Now, we retrieve the data for user1 from the contract's public mapping.
        const registeredUser = await registry.users(user1.address);

        // 'expect' is from the 'chai' library. We use it to make assertions.
        // We are checking if the data stored on the blockchain matches what we expect.
        expect(registeredUser.isRegistered).to.equal(true);
        expect(registeredUser.role).to.equal(1); // Check if the role is FARMER
        expect(registeredUser.userAddress).to.equal(user1.address);
    });

    // Test case #2: It should prevent a user from registering twice
    it("Should fail if a user tries to register more than once", async function () {
        // First, register the user successfully.
        await registry.connect(user1).registerUser(1); // Role 1 = FARMER

        // Now, try to register the SAME user again.
        // We expect this transaction to fail ('revert').
        await expect(
            registry.connect(user1).registerUser(2) // Trying to re-register as a BUYER
        ).to.be.revertedWith("User is already registered."); // This message must EXACTLY match the one in our require() statement.
    });

    // Test case #3: It should emit an event on successful registration
    it("Should emit a UserRegistered event upon successful registration", async function () {
        // We test that an event is correctly emitted with the right data.
        await expect(registry.connect(user1).registerUser(1)) // Role 1 = FARMER
            .to.emit(registry, "UserRegistered")
            .withArgs(user1.address, 1); // Check if the event data (user address and role) is correct.
    });
});