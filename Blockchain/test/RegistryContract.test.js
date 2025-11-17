import { expect } from "chai";
import hre from "hardhat";

describe("RegistryContract", function () {
    let registry;
    let owner;
    let user1;

    beforeEach(async function () {
        [owner, user1] = await hre.ethers.getSigners();
        const RegistryContractFactory = await hre.ethers.getContractFactory("RegistryContract");
        registry = await RegistryContractFactory.deploy();
    });

    // We define a sample profile object to use in our tests
    const sampleProfile = {
        name: "Green Valley Farms",
        location: "Nashik, Maharashtra",
        contactInfo: "contact@greenvalley.com",
        licenseOrId: "FSSAI#12345"
    };

    it("Should allow a new user to register with a full profile", async function () {
        const userRole = 1; // FARMER

        // UPDATED: Call registerUser with the role and the profile object
        await registry.connect(user1).registerUser(userRole, sampleProfile);

        const registeredUser = await registry.users(user1.address);

        // Test the main properties
        expect(registeredUser.isRegistered).to.equal(true);
        expect(registeredUser.role).to.equal(userRole);
        
        // Test the nested profile properties
        expect(registeredUser.profile.name).to.equal(sampleProfile.name);
        expect(registeredUser.profile.location).to.equal(sampleProfile.location);
    });

    it("Should fail if a name is not provided", async function () {
        const profileWithNoName = { ...sampleProfile, name: "" }; // Create a copy with an empty name

        await expect(
            registry.connect(user1).registerUser(1, profileWithNoName)
        ).to.be.revertedWith("Name cannot be empty.");
    });
    
    it("Should fail if a user tries to register more than once", async function () {
        // Register successfully the first time
        await registry.connect(user1).registerUser(1, sampleProfile);

        // Try to register again
        await expect(
            registry.connect(user1).registerUser(2, sampleProfile) // Trying to re-register as a BUYER
        ).to.be.revertedWith("User is already registered.");
    });
});