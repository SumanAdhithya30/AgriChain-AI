// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./ProductContract.sol";

contract TraceabilityContract {

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

    constructor(address _registryAddress, address _productAddress) {
        registry = RegistryContract(_registryAddress);
        product  = ProductContract(_productAddress);
    }

    // Farmer who owns the product NFT OR any registered Logistics Provider can update
    modifier onlyAuthorized(uint256 _productId) {
        ( , RegistryContract.UserRole role, bool isRegistered, ) = registry.users(msg.sender);
        require(isRegistered, "Caller is not registered on AgriChain");

        bool isFarmerOwner = (role == RegistryContract.UserRole.FARMER) &&
                             (product.ownerOf(_productId) == msg.sender);
        bool isLogistics   = (role == RegistryContract.UserRole.LOGISTICS_PROVIDER);

        require(isFarmerOwner || isLogistics, "Only the product's farmer or a Logistics Provider can add updates");
        _;
    }

    function addTrackingUpdate(
        uint256 _productId,
        string memory _location,
        string memory _status
    ) external onlyAuthorized(_productId) {
        _trackingHistory[_productId].push(TrackingUpdate({
            timestamp: block.timestamp,
            location:  _location,
            status:    _status,
            updatedBy: msg.sender
        }));

        emit ProductStatusUpdated(_productId, block.timestamp, _location, _status, msg.sender);
    }

    function getTrackingHistory(uint256 _productId) external view returns (TrackingUpdate[] memory) {
        return _trackingHistory[_productId];
    }
}
