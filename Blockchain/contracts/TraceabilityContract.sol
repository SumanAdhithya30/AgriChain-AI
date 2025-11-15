// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TraceabilityContract
 * @dev Manages the supply chain history for products.
 * Allows an authorized party (the contract owner) to add tracking updates.
 */
contract TraceabilityContract is Ownable {

    //===========
    // Data Types
    //===========

    struct TrackingUpdate {
        uint256 timestamp;
        string location;
        string status; // e.g., "In Transit", "Warehouse", "Delivered"
    }

    // A mapping from a product ID (the NFT token ID) to an array of its tracking updates.
    mapping(uint256 => TrackingUpdate[]) private _trackingHistory;

    //===========
    // Events
    //===========
    event ProductStatusUpdated(
        uint256 indexed productId,
        uint256 timestamp,
        string location,
        string status
    );

    //===========
    // Constructor
    //===========
    // CORRECTED: The Ownable constructor for OpenZeppelin v4 takes no arguments.
    constructor() Ownable() {}

    //===========
    // Functions
    //===========

    /**
     * @dev Adds a new tracking update to a product's history.
     * Restricted to the contract owner (e.g., a centralized logistics partner).
     * @param _productId The ID of the product NFT being updated.
     * @param _location A description of the current location.
     * @param _status The current status.
     */
    function addTrackingUpdate(
        uint256 _productId,
        string memory _location,
        string memory _status
    ) external onlyOwner {
        _trackingHistory[_productId].push(TrackingUpdate({
            timestamp: block.timestamp,
            location: _location,
            status: _status
        }));

        emit ProductStatusUpdated(
            _productId,
            block.timestamp,
            _location,
            _status
        );
    }

    /**
     * @dev Public view function to retrieve the entire tracking history for a product.
     * @param _productId The ID of the product to query.
     * @return An array of TrackingUpdate structs.
     */
    function getTrackingHistory(uint256 _productId) external view returns (TrackingUpdate[] memory) {
        return _trackingHistory[_productId];
    }
}