import { expect } from "chai";
import hre from "hardhat";

describe("ProductContract - V3 (Decentralized)", function () {
    let registry;
    let productContract;
    let owner, farmer1, farmer2, nonFarmer;

    const toWei = (value) => hre.ethers.parseEther(value.toString());

    // Define a sample profile we can reuse for registration
    const sampleProfile = {
        name: "Test Farmer",
        location: "Test Location",
        contactInfo: "contact@test.com",
        licenseOrId: "ID123"
    };

    beforeEach(async function () {
        [owner, farmer1, farmer2, nonFarmer] = await hre.ethers.getSigners();
        
        // 1. We MUST deploy the RegistryContract first
        const RegistryFactory = await hre.ethers.getContractFactory("RegistryContract");
        registry = await RegistryFactory.deploy();

        // 2. We then deploy the ProductContract, passing the Registry's address to its constructor
        const ProductContractFactory = await hre.ethers.getContractFactory("ProductContract");
        productContract = await ProductContractFactory.deploy(await registry.getAddress());
    });

    describe("Product Listing Logic", function() {
        it("Should ALLOW a registered Farmer to list a new product", async function () {
            // First, we must register 'farmer1' as a Farmer (role enum #1)
            await registry.connect(farmer1).registerUser(1, sampleProfile);

            // Now, farmer1 should be able to successfully list a product
            // We use 'to.not.be.reverted' to check that the transaction succeeds
            await expect(
                productContract.connect(farmer1).listNewProduct("Organic Apples", "hash1", toWei(0.5), 500, "kg")
            ).to.not.be.reverted;

            // Verify the product was created correctly
            const details = await productContract.productDetails(1);
            expect(await productContract.ownerOf(1)).to.equal(farmer1.address);
            expect(details.farmer).to.equal(farmer1.address);
            expect(details.productName).to.equal("Organic Apples");
        });

        it("Should PREVENT a registered Buyer from listing a product", async function () {
            // First, register 'nonFarmer' as a Buyer (role enum #2)
            await registry.connect(nonFarmer).registerUser(2, { ...sampleProfile, name: "Test Buyer" });

            // Now, the buyer should be BLOCKED from listing a product
            await expect(
                productContract.connect(nonFarmer).listNewProduct("Illegal Apples", "hash_err", toWei(1), 10, "kg")
            ).to.be.revertedWith("Caller is not a registered Farmer");
        });
        
        it("Should PREVENT an unregistered user from listing a product", async function () {
            // The 'farmer2' account has not been registered at all. The call should fail.
            await expect(
                productContract.connect(farmer2).listNewProduct("Unregistered Apples", "hash_err2", toWei(1), 20, "kg")
            ).to.be.revertedWith("Caller is not a registered Farmer");
        });
    });

    // We should also re-test our other logic to ensure it wasn't broken by our changes.
    // This is called "regression testing".
    describe("Existing Logic (Regression Tests)", function() {
        beforeEach(async function() {
            // Register owner as a farmer so they can list products for these tests
            await registry.connect(owner).registerUser(1, { ...sampleProfile, name: "Owner Farmer" });
        });
        
        it("Should fail if the price is zero", async function () {
            await expect(
                productContract.connect(owner).listNewProduct("Zero Price Apples", "hash_zero", 0, 100, "kg")
            ).to.be.revertedWith("Price must be greater than zero");
        });
    });
});