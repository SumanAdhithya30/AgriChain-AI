// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol"; // Using the standard ERC721
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol"; // Re-importing Counters

contract ProductContract is ERC721, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    address public agreementContractAddress;

    struct ProductDetails {
        string productName;
        string ipfsImageHash;
        uint256 pricePerUnit;
        uint256 quantityAvailable;
        string unit;
        uint256 dateHarvested;
        address farmer;
        bool isForSale;
    }

    mapping(uint256 => ProductDetails) public productDetails;
    
    // We will keep a list of all active product IDs ourselves
    uint256[] public allProductIds;

    constructor() ERC721("AgriChainProduct", "AGP") Ownable() {}

    function listNewProduct(
        address _farmer,
        string memory _productName,
        string memory _ipfsImageHash,
        uint256 _pricePerUnit,
        uint256 _quantityAvailable,
        string memory _unit
    ) external onlyOwner {
        require(_pricePerUnit > 0, "Price must be greater than zero");
        require(_quantityAvailable > 0, "Quantity must be greater than zero");

        _tokenIdCounter.increment();
        uint256 newTokenId = _tokenIdCounter.current();

        _safeMint(_farmer, newTokenId);
        allProductIds.push(newTokenId); // Add the new ID to our list

        productDetails[newTokenId] = ProductDetails({
            productName: _productName,
            ipfsImageHash: _ipfsImageHash,
            pricePerUnit: _pricePerUnit,
            quantityAvailable: _quantityAvailable,
            unit: _unit,
            dateHarvested: block.timestamp,
            farmer: _farmer,
            isForSale: true
        });
    }

    function decreaseQuantity(uint256 _productId, uint256 _amount) external {
        require(msg.sender == agreementContractAddress, "Only AgreementContract can call this");
        ProductDetails storage product = productDetails[_productId];
        require(product.quantityAvailable >= _amount, "Not enough quantity to decrease");
        
        product.quantityAvailable -= _amount;
        
        if (product.quantityAvailable == 0) {
            product.isForSale = false;
        }
    }
    
    function setAgreementContract(address _address) external onlyOwner {
        agreementContractAddress = _address;
    }
    
    // --- View Functions for Frontend ---

    function getTotalProducts() external view returns (uint256) {
        return allProductIds.length;
    }

    function getProductIds(uint256 page, uint256 limit) external view returns (uint256[] memory) {
        // This is a simple pagination logic. In a real app, this would be more robust.
        uint256 total = allProductIds.length;
        if(page == 0) page = 1;
        uint256 startIndex = (page - 1) * limit;
        if(startIndex >= total) return new uint256[](0);
        
        uint256 endIndex = startIndex + limit;
        if(endIndex > total) endIndex = total;
        
        uint256[] memory ids = new uint256[](endIndex - startIndex);
        uint counter = 0;
        for(uint i = startIndex; i < endIndex; i++){
            ids[counter] = allProductIds[i];
            counter++;
        }
        return ids;
    }

}