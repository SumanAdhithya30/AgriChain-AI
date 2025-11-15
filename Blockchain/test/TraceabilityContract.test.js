import { expect } from "chai";
import hre from "hardhat";

describe("TraceabilityContract", function () {
    let traceabilityContract;
    let owner;
    let logisticsPartner;

    beforeEach(async function () {
        [owner, logisticsPartner] = await hre.ethers.getSigners();

        const TraceabilityFactory = await hre.ethers.getContractFactory("TraceabilityContract");
        traceabilityContract = await TraceabilityFactory.deploy();
        
        // For testing, let's make the logisticsPartner an authorized party (the owner for this test)
        // In a real scenario, we might have a more complex role system.
        await traceabilityContract.transferOwnership(logisticsPartner.address);
    });

    it("Should allow the owner to add a tracking update", async function () {
        const productId = 1;
        const location = "Farm Warehouse";
        const status = "Awaiting Pickup";

        await expect(
            traceabilityContract.connect(logisticsPartner).addTrackingUpdate(productId, location, status)
        ).to.emit(traceabilityContract, "ProductStatusUpdated");
        
        const history = await traceabilityContract.getTrackingHistory(productId);
        
        expect(history.length).to.equal(1);
        expect(history[0].location).to.equal(location);
        expect(history[0].status).to.equal(status);
    });
    
    it("Should fail if a non-owner tries to add an update", async function () {
        const productId = 1;
        const location = "Somewhere";
        const status = "Attempted Hijack";
        
        // The 'owner' account is no longer the owner, as it was transferred.
        await expect(
            traceabilityContract.connect(owner).addTrackingUpdate(productId, location, status)
        ).to.be.revertedWith("Ownable: caller is not the owner");
    });
});