import { expect } from "chai";
import hre from "hardhat";

describe("AgreementContract", function () {
    let productContract;
    let agreementContract;
    let owner;
    let farmer;
    let buyer;

    const toWei = (value) => hre.ethers.parseEther(value.toString());

    beforeEach(async function () {
        [owner, farmer, buyer] = await hre.ethers.getSigners();
        
        const ProductFactory = await hre.ethers.getContractFactory("ProductContract");
        productContract = await ProductFactory.deploy();
        
        const AgreementFactory = await hre.ethers.getContractFactory("AgreementContract");
        agreementContract = await AgreementFactory.deploy(await productContract.getAddress());
    });

    it("Should allow a buyer to create an agreement and escrow funds", async function () {
        const productId = 1;
        const price = toWei(1);

        // CHANGE: listNewProduct now requires a price and must be called by the owner.
        await productContract.connect(owner).listNewProduct(farmer.address, "Organic Apples", "hash3", price);
        
        await expect(
            agreementContract.connect(buyer).createAgreement(productId, price, { value: price })
        ).to.emit(agreementContract, "AgreementCreated");

        const contractBalance = await hre.ethers.provider.getBalance(await agreementContract.getAddress());
        expect(contractBalance).to.equal(price);
    });

    it("Should allow the seller to receive payment after buyer confirms delivery", async function () {
        const productId = 1;
        const price = toWei(2);

        // CHANGE: listNewProduct now requires a price and must be called by the owner.
        await productContract.connect(owner).listNewProduct(farmer.address, "Organic Carrots", "hash4", price);

        await agreementContract.connect(buyer).createAgreement(productId, price, { value: price });
        
        const initialFarmerBalance = await hre.ethers.provider.getBalance(farmer.address);
        
        await agreementContract.connect(buyer).confirmDelivery(1);
        
        await agreementContract.connect(farmer).settlePayment(1);

        const finalFarmerBalance = await hre.ethers.provider.getBalance(farmer.address);
        expect(finalFarmerBalance).to.be.gt(initialFarmerBalance); // .gt is "greater than"

        const finalContractBalance = await hre.ethers.provider.getBalance(await agreementContract.getAddress());
        expect(finalContractBalance).to.equal(0);
    });

    it("Should fail if a non-buyer tries to confirm delivery", async function () {
        const productId = 1;
        const price = toWei(1);

        // CHANGE: listNewProduct now requires a price and must be called by the owner.
        await productContract.connect(owner).listNewProduct(farmer.address, "Some Product", "hash5", price);
        
        await agreementContract.connect(buyer).createAgreement(productId, price, { value: price });

        await expect(
            agreementContract.connect(owner).confirmDelivery(1)
        ).to.be.revertedWith("Only the buyer can confirm delivery.");
    });
});