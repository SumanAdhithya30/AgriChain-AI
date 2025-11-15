import { expect } from "chai";
import hre from "hardhat";

describe("ProductContract", function () {
    let productContract;
    let owner;
    let farmer;

    beforeEach(async function () {
        [owner, farmer] = await hre.ethers.getSigners();
        const ProductContractFactory = await hre.ethers.getContractFactory("ProductContract");
        productContract = await ProductContractFactory.deploy();
    });

    it("Should mint a new NFT, assign it to the farmer, and store details", async function () {
        const productName = "Organic Tomatoes";
        const ipfsHash = "QmTp2h4544p4p5g5V5f5g5h6h6j6k6l6m6n6o6";

        const tx = await productContract.listNewProduct(farmer.address, productName, ipfsHash);
        await tx.wait();
        
        expect(await productContract.ownerOf(1)).to.equal(farmer.address);
        expect(await productContract.balanceOf(farmer.address)).to.equal(1);
        expect(await productContract.tokenURI(1)).to.equal("");

        const details = await productContract.productDetails(1);
        expect(details.productName).to.equal(productName);
        expect(details.ipfsImageHash).to.equal(ipfsHash);
        expect(details.farmer).to.equal(farmer.address);
        expect(details.dateHarvested).to.be.above(0);
    });

    // THIS IS THE CORRECTED TEST
    it("Should increment token IDs for each new product", async function () {
        await productContract.listNewProduct(farmer.address, "Tomatoes", "hash1");
        expect(await productContract.ownerOf(1)).to.equal(farmer.address);
        
        await productContract.listNewProduct(owner.address, "Cucumbers", "hash2");
        expect(await productContract.ownerOf(2)).to.equal(owner.address);
    });
});