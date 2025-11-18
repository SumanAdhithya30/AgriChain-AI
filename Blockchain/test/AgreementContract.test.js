import { expect } from "chai";
import hre from "hardhat";

describe("AgreementContract - V2 (Quantity)", function () {
    let productContract, agreementContract;
    let owner, farmer, buyer;

    const toWei = (value) => hre.ethers.parseEther(value.toString());
    const pricePerKg = toWei(0.01); // 0.01 ETH per kg

    beforeEach(async function () {
        [owner, farmer, buyer] = await hre.ethers.getSigners();
        
        const ProductFactory = await hre.ethers.getContractFactory("ProductContract");
        productContract = await ProductFactory.deploy();
        
        const AgreementFactory = await hre.ethers.getContractFactory("AgreementContract");
        agreementContract = await AgreementFactory.deploy(await productContract.getAddress());

        // CRITICAL: We must link the two contracts together
        await productContract.connect(owner).setAgreementContract(await agreementContract.getAddress());
    });

    it("Should create an agreement for a specific quantity", async function () {
        // List a product with 100 kg available
        await productContract.connect(owner).listNewProduct(farmer.address, "Potatoes", "hash_kilo", pricePerKg, 100, "kg");

        const productId = 1;
        const quantityToBuy = 20; // Buyer wants 20 kg
        const totalValue = toWei(0.01 * quantityToBuy); // 0.2 ETH

        // Buyer calls createAgreement with the quantity, sending the total value
        await agreementContract.connect(buyer).createAgreement(productId, quantityToBuy, { value: totalValue });
        
        // Check that the product's available quantity was reduced
        const details = await productContract.productDetails(productId);
        expect(details.quantityAvailable).to.equal(80); // 100 - 20

        // Check that the agreement was stored correctly
        const agreement = await agreementContract.agreements(1);
        expect(agreement.quantityPurchased).to.equal(quantityToBuy);
        expect(agreement.totalValue).to.equal(totalValue);
    });

    it("Should fail if the buyer does not send the correct total value", async function () {
        await productContract.connect(owner).listNewProduct(farmer.address, "Potatoes", "hash_kilo", pricePerKg, 100, "kg");

        const productId = 1;
        const quantityToBuy = 20;
        const incorrectValue = toWei(0.1); // Sent 0.1 instead of 0.2 ETH

        await expect(
            agreementContract.connect(buyer).createAgreement(productId, quantityToBuy, { value: incorrectValue })
        ).to.be.revertedWith("Payment must match the total value (price * quantity).");
    });
    
    it("Should allow full payment and settlement flow", async function () {
        await productContract.connect(owner).listNewProduct(farmer.address, "Potatoes", "hash_kilo", pricePerKg, 100, "kg");
        const totalValue = toWei(0.01 * 20);

        // Buy
        await agreementContract.connect(buyer).createAgreement(1, 20, { value: totalValue });

        const initialFarmerBalance = await hre.ethers.provider.getBalance(farmer.address);
        
        // Confirm
        await agreementContract.connect(buyer).confirmDelivery(1);
        
        // Settle
        await agreementContract.connect(farmer).settlePayment(1);

        const finalFarmerBalance = await hre.ethers.provider.getBalance(farmer.address);
        expect(finalFarmerBalance).to.be.gt(initialFarmerBalance);
    });
});