import { expect } from "chai";
import hre from "hardhat";

// Renamed to V3 to match the new architecture
describe("AgreementContract - V3 (Decentralized)", function () {
    let registry, productContract, agreementContract;
    let owner, farmer, buyer;

    const toWei = (value) => hre.ethers.parseEther(value.toString());
    const pricePerKg = toWei(0.01);

    // Sample farmer profile for registration
    const farmerProfile = { name: "Test Farmer", location: "Test Location", contactInfo: "", licenseOrId: "" };

    beforeEach(async function () {
        [owner, farmer, buyer] = await hre.ethers.getSigners();
        
        // --- THIS IS THE FIX ---
        // 1. Deploy Registry first
        const RegistryFactory = await hre.ethers.getContractFactory("RegistryContract");
        registry = await RegistryFactory.deploy();

        // 2. Deploy ProductContract, passing the Registry's address
        const ProductFactory = await hre.ethers.getContractFactory("ProductContract");
        productContract = await ProductFactory.deploy(await registry.getAddress());
        
        // 3. Deploy AgreementContract
        const AgreementFactory = await hre.ethers.getContractFactory("AgreementContract");
        agreementContract = await AgreementFactory.deploy(await productContract.getAddress());

        // 4. Link the contracts
        await productContract.connect(owner).setAgreementContract(await agreementContract.getAddress());
        // --- END OF FIX ---
    });

    // Helper function to register a farmer and list a product for tests
    async function setupProduct() {
        // Register the farmer
        await registry.connect(farmer).registerUser(1, farmerProfile);
        // Farmer lists a product
        await productContract.connect(farmer).listNewProduct("Potatoes", "hash_kilo", pricePerKg, 100, "kg");
    }

    it("Should create an agreement for a specific quantity", async function () {
        await setupProduct(); // Use the helper
        const productId = 1;
        const quantityToBuy = 20;
        const totalValue = toWei(0.01 * quantityToBuy);

        await agreementContract.connect(buyer).createAgreement(productId, quantityToBuy, { value: totalValue });
        
        const details = await productContract.productDetails(productId);
        expect(details.quantityAvailable).to.equal(80);
    });

    it("Should fail if the buyer does not send the correct total value", async function () {
        await setupProduct(); // Use the helper
        const incorrectValue = toWei(0.1);

        await expect(
            agreementContract.connect(buyer).createAgreement(1, 20, { value: incorrectValue })
        ).to.be.revertedWith("Payment must match the total value (price * quantity).");
    });
    
    it("Should allow full payment and settlement flow", async function () {
        await setupProduct(); // Use the helper
        const totalValue = toWei(0.01 * 20);
        await agreementContract.connect(buyer).createAgreement(1, 20, { value: totalValue });

        const initialFarmerBalance = await hre.ethers.provider.getBalance(farmer.address);
        
        await agreementContract.connect(buyer).confirmDelivery(1);
        await agreementContract.connect(farmer).settlePayment(1);

        const finalFarmerBalance = await hre.ethers.provider.getBalance(farmer.address);
        expect(finalFarmerBalance).to.be.gt(initialFarmerBalance);
    });
});