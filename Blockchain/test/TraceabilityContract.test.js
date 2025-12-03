import { expect } from "chai";
import hre from "hardhat";

describe("TraceabilityContract - V3 (Farmer-Based)", function () {
    let registry, productContract, traceabilityContract;
    let owner, farmer1, otherUser;
    
    const farmerProfile = { name: "Test Farmer", location: "Nashik", contactInfo: "", licenseOrId: "" };

    beforeEach(async function () {
        [owner, farmer1, otherUser] = await hre.ethers.getSigners();
        
        const RegistryFactory = await hre.ethers.getContractFactory("RegistryContract");
        registry = await RegistryFactory.deploy();
        
        const ProductFactory = await hre.ethers.getContractFactory("ProductContract");
        productContract = await ProductFactory.deploy(await registry.getAddress());
        
        const TraceabilityFactory = await hre.ethers.getContractFactory("TraceabilityContract");
        traceabilityContract = await TraceabilityFactory.deploy(await registry.getAddress(), await productContract.getAddress());
    });

    it("Should ALLOW the product owner (farmer) to add a tracking update", async function () {
        // Register farmer1 and have them list a product
        await registry.connect(farmer1).registerUser(1, farmerProfile);
        await productContract.connect(farmer1).listNewProduct("Apples", "hash", 1, 100, "kg");
        
        // As farmer1 (the owner), add an update for product #1
        await expect(
            traceabilityContract.connect(farmer1).addTrackingUpdate(1, "Farm cold storage", "Ready for pickup")
        ).to.not.be.reverted;
    });
    
    it("Should PREVENT a non-owner from adding an update", async function () {
        // farmer1 lists a product
        await registry.connect(farmer1).registerUser(1, farmerProfile);
        await productContract.connect(farmer1).listNewProduct("Apples", "hash", 1, 100, "kg");
        
        // 'otherUser' tries to add an update for farmer1's product
        await expect(
            traceabilityContract.connect(otherUser).addTrackingUpdate(1, "Tampering location", "Hijacked")
        ).to.be.revertedWith("Caller is not the owner of this product");
    });
});
