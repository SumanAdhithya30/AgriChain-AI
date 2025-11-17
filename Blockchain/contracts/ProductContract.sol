// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol"; // We'll bring this back for simplicity and reliability

// Inherit from ERC721Enumerable in addition to Ownable.
contract ProductContract is ERC721Enumerable, Ownable {
    using Counters for Counters.Counter;
    // We bring back the simple counter. It's the most reliable way.
    Counters.Counter private _tokenIdCounter;

    struct ProductDetails {
        string productName;
        string ipfsImageHash;
        uint256 price; // NEW: The price of the product in WEI
        uint256 dateHarvested;
        address farmer;
        bool isForSale;
    }

    mapping(uint256 => ProductDetails) public productDetails;

    constructor() ERC721("AgriChainProduct", "AGP") Ownable() {}

    function listNewProduct(
        address _farmer,
        string memory _productName,
        string memory _ipfsImageHash,
        uint256 _price // NEW: Price is now a required parameter
    ) external onlyOwner {
        require(_price > 0, "Price must be greater than zero");

        _tokenIdCounter.increment();
        uint256 newTokenId = _tokenIdCounter.current();

        _safeMint(_farmer, newTokenId);

        productDetails[newTokenId] = ProductDetails({
            productName: _productName,
            ipfsImageHash: _ipfsImageHash,
            price: _price,
            dateHarvested: block.timestamp,
            farmer: _farmer,
            isForSale: true
        });
    }

    // We don't need the complex _update override for our use case.
    // The default behavior from inheriting ERC721Enumerable is sufficient.

    // A helper function to change the state when a product is sold
    function markAsSold(uint256 _tokenId) external {
        // We'll need to add a check here to ensure only the AgreementContract can call this
        productDetails[_tokenId].isForSale = false;
    }
}