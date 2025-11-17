import { expect } from "chai";
import hre from "hardhat";

describe("ProductContract", function () {
    let productContract;
    let owner;
    let farmer;

    // Helper to convert Ether to Wei for the price
    const toWei = (value) => hre.ethers.parseEther(value.toString());

    beforeEach(async function () {
        [owner, farmer] = await hre.ethers.getSigners();
        const ProductContractFactory = await hre.ethers.getContractFactory("ProductContract");
        productContract = await ProductContractFactory.deploy();
    });

    it("Should mint a new NFT with a price and store details", async function () {
        const productName = "Organic Tomatoes";
        const ipfsHash = "QmTp2h4544p4p5g5V5f5g5h6h6j6k6l6m6n6o6";
        const price = toWei(1); // NEW: Define a price of 1 ETH

        // CHANGE: We now call listNewProduct with the price.
        // Also, since it is now `onlyOwner`, we must call it from the `owner` account.
        const tx = await productContract.connect(owner).listNewProduct(farmer.address, productName, ipfsHash, price);
        await tx.wait();
        
        expect(await productContract.ownerOf(1)).to.equal(farmer.address);

        const details = await productContract.productDetails(1);
        expect(details.productName).to.equal(productName);
        expect(details.ipfsImageHash).to.equal(ipfsHash);
        expect(details.price).to.equal(price); // NEW: Test that the price was stored correctly.
        expect(details.farmer).to.equal(farmer.address);
        expect(details.isForSale).to.equal(true); // NEW: Test the for-sale status.
    });

    it("Should fail if the price is zero", async function () {
        const price = toWei(0); // Price of zero

        // We expect this transaction to fail with the specific error message from our contract.
        await expect(
            productContract.connect(owner).listNewProduct(farmer.address, "No Price Tomatoes", "hash", price)
        ).to.be.revertedWith("Price must be greater than zero");
    });

    it("Should increment token IDs for each new product", async function () {
        // We can no longer use the totalSupply check as we removed Enumerable to fix the compile error.
        // We will test by checking ownerOf, which is a reliable method.

        // List product 1
        await productContract.connect(owner).listNewProduct(farmer.address, "Tomatoes", "hash1", toWei(1));
        expect(await productContract.ownerOf(1)).to.equal(farmer.address);
        
        // List product 2
        await productContract.connect(owner).listNewProduct(owner.address, "Cucumbers", "hash2", toWei(2));
        expect(await productContract.ownerOf(2)).to.equal(owner.address);
    });
});