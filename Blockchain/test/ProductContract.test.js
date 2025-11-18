import { expect } from "chai";
import hre from "hardhat";

describe("ProductContract - V2 (Quantity)", function () {
    let productContract;
    let owner, farmer, agreementContractMock;

    const toWei = (value) => hre.ethers.parseEther(value.toString());

    beforeEach(async function () {
        [owner, farmer, agreementContractMock] = await hre.ethers.getSigners();
        const ProductContractFactory = await hre.ethers.getContractFactory("ProductContract");
        productContract = await ProductContractFactory.deploy();
        
        // In our tests, we need to set the agreement contract address
        // We will use a mock address (another signer) for this.
        await productContract.connect(owner).setAgreementContract(agreementContractMock.address);
    });

    it("Should list a new product with quantity and price per unit", async function () {
        const price = toWei(0.1);
        const quantity = 1000; // 1000 kg
        const unit = "kg";

        await productContract.connect(owner).listNewProduct(farmer.address, "Tomatoes", "hash1", price, quantity, unit);
        
        const details = await productContract.productDetails(1);
        expect(await productContract.ownerOf(1)).to.equal(farmer.address);
        expect(details.pricePerUnit).to.equal(price);
        expect(details.quantityAvailable).to.equal(quantity);
        expect(details.unit).to.equal(unit);
    });

    it("Should allow the agreement contract to decrease quantity", async function () {
        await productContract.connect(owner).listNewProduct(farmer.address, "Tomatoes", "hash1", toWei(0.1), 100, "kg");
        
        const amountToDecrease = 25;
        // Connect as the mock 'agreement contract' to call the function
        await productContract.connect(agreementContractMock).decreaseQuantity(1, amountToDecrease);

        const details = await productContract.productDetails(1);
        expect(details.quantityAvailable).to.equal(75); // 100 - 25
    });

    it("Should fail if a non-agreement-contract tries to decrease quantity", async function () {
        await productContract.connect(owner).listNewProduct(farmer.address, "Tomatoes", "hash1", toWei(0.1), 100, "kg");
        
        // 'farmer' tries to call the function, should be reverted
        await expect(
            productContract.connect(farmer).decreaseQuantity(1, 10)
        ).to.be.revertedWith("Only AgreementContract can call this");
    });
    
    it("Should mark product as not for sale when quantity reaches zero", async function () {
        await productContract.connect(owner).listNewProduct(farmer.address, "Limited Edition Apple", "hash2", toWei(1), 1, "piece");

        await productContract.connect(agreementContractMock).decreaseQuantity(1, 1);

        const details = await productContract.productDetails(1);
        expect(details.quantityAvailable).to.equal(0);
        expect(details.isForSale).to.equal(false);
    });
});