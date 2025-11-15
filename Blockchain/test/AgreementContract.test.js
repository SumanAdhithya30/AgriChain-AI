import { expect } from "chai";
import hre from "hardhat";

describe("AgreementContract", function () {
    let registry;
    let productContract;
    let agreementContract;
    let owner;
    let farmer;
    let buyer;

    // A utility to easily convert Ether to Wei
    const toWei = (value) => hre.ethers.parseEther(value.toString());

    // Before each test, we deploy all three contracts
    beforeEach(async function () {
        [owner, farmer, buyer] = await hre.ethers.getSigners();

        // 1. Deploy RegistryContract
        const RegistryFactory = await hre.ethers.getContractFactory("RegistryContract");
        registry = await RegistryFactory.deploy();
        
        // 2. Deploy ProductContract
        const ProductFactory = await hre.ethers.getContractFactory("ProductContract");
        productContract = await ProductFactory.deploy();
        
        // 3. Deploy AgreementContract, providing the address of the ProductContract
        const AgreementFactory = await hre.ethers.getContractFactory("AgreementContract");
        agreementContract = await AgreementFactory.deploy(await productContract.getAddress());
    });

    it("Should allow a buyer to create an agreement and escrow funds", async function () {
        // First, the owner of the ProductContract lists a new product for the farmer
        await productContract.connect(owner).listNewProduct(farmer.address, "Organic Apples", "hash3");

        const productId = 1;
        const price = toWei(1); // 1 Ether

        // The buyer creates the agreement by calling the function AND sending 1 ETH.
        await expect(
            agreementContract.connect(buyer).createAgreement(productId, price, { value: price })
        ).to.emit(agreementContract, "AgreementCreated")
         .withArgs(1, productId, buyer.address, farmer.address, price);

        // Check if the funds are now held by the contract
        const contractBalance = await hre.ethers.provider.getBalance(await agreementContract.getAddress());
        expect(contractBalance).to.equal(price);

        // Check if the agreement was stored correctly
        const agreement = await agreementContract.agreements(1);
        expect(agreement.buyer).to.equal(buyer.address);
        expect(agreement.seller).to.equal(farmer.address);
        expect(agreement.state).to.equal(0); // 0 corresponds to AgreementState.CREATED
    });

    it("Should allow the seller to receive payment after buyer confirms delivery", async function () {
        const productId = 1;
        const price = toWei(2); // 2 Ether

        // 1. A product is created for the farmer
        await productContract.connect(owner).listNewProduct(farmer.address, "Organic Carrots", "hash4");

        // 2. The buyer creates the agreement
        await agreementContract.connect(buyer).createAgreement(productId, price, { value: price });
        
        // Let's check the farmer's balance BEFORE the transaction
        const initialFarmerBalance = await hre.ethers.provider.getBalance(farmer.address);
        
        // 3. The buyer confirms delivery
        await expect(agreementContract.connect(buyer).confirmDelivery(1))
            .to.emit(agreementContract, "DeliveryConfirmed")
            .withArgs(1);
        
        // 4. The seller settles the payment
        const tx = await agreementContract.connect(farmer).settlePayment(1);

        // Check if the farmer's balance has increased correctly.
        // We can't check for exact equality due to gas costs, so we check "closeTo".
        const finalFarmerBalance = await hre.ethers.provider.getBalance(farmer.address);
        expect(finalFarmerBalance).to.be.above(initialFarmerBalance);

        // Check if the contract's balance is now zero
        const finalContractBalance = await hre.ethers.provider.getBalance(await agreementContract.getAddress());
        expect(finalContractBalance).to.equal(0);
        
        // Check if the agreement state is CLOSED
        const agreement = await agreementContract.agreements(1);
        expect(agreement.state).to.equal(2); // 2 corresponds to AgreementState.CLOSED
    });

    it("Should fail if a non-buyer tries to confirm delivery", async function () {
        const productId = 1;
        const price = toWei(1);
        await productContract.listNewProduct(farmer.address, "Some Product", "hash5");
        await agreementContract.connect(buyer).createAgreement(productId, price, { value: price });

        // A random person (the owner) tries to confirm delivery
        await expect(
            agreementContract.connect(owner).confirmDelivery(1)
        ).to.be.revertedWith("Only the buyer can confirm delivery.");
    });
});