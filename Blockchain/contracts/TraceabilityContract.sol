// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// 1. IMPORT ProductContract to check NFT ownership
import "./ProductContract.sol"; 

contract TraceabilityContract { // Note: We remove Ownable as it's no longer needed

    // 2. CREATE LINKS to both Registry and Product contracts
    RegistryContract public registry;
    ProductContract public product;

    struct TrackingUpdate {
        uint256 timestamp;
        string location;
        string status;
        address updatedBy;
    }

    mapping(uint256 => TrackingUpdate[]) private _trackingHistory;

    event ProductStatusUpdated(
        uint256 indexed productId,
        uint256 timestamp,
        string location,
        string status,
        address indexed updatedBy
    );

    // 3. THE CONSTRUCTOR NOW REQUIRES BOTH addresses
    constructor(address _registryAddress, address _productAddress) {
        registry = RegistryContract(_registryAddress);
        product = ProductContract(_productAddress);
    }
    
    // 4. THE NEW MODIFIER: Checks if the caller owns the specific product NFT
    modifier onlyProductOwner(uint256 _productId) {
        require(product.ownerOf(_productId) == msg.sender, "Caller is not the owner of this product");
        _;
    }

    // 5. UPDATED FUNCTION: Now uses the new modifier
    function addTrackingUpdate(
        uint256 _productId,
        string memory _location,
        string memory _status
    ) external onlyProductOwner(_productId) { // <-- USE THE NEW MODIFIER and pass the ID
        _trackingHistory[_productId].push(TrackingUpdate({
            timestamp: block.timestamp,
            location: _location,
            status: _status,
            updatedBy: msg.sender
        }));

        emit ProductStatusUpdated(
            _productId,
            block.timestamp,
            _location,
            _status,
            msg.sender
        );
    }

    function getTrackingHistory(uint256 _productId) external view returns (TrackingUpdate[] memory) {
        return _trackingHistory[_productId];
    }
}