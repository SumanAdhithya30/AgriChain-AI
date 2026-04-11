// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./RegistryContract.sol"; 
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract ProductContract is ERC721, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    RegistryContract public registry; 
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
    uint256[] public allProductIds;
    
    constructor(address _registryAddress) ERC721("AgriChainProduct", "AGP") Ownable() {
        registry = RegistryContract(_registryAddress);
    }
    
    // CORRECTED MODIFIER - It takes 4 return values
    modifier onlyFarmer() {
        ( , RegistryContract.UserRole role, bool isRegistered, ) = registry.users(msg.sender);
        require(isRegistered && role == RegistryContract.UserRole.FARMER, "Caller is not a registered Farmer");
        _;
    }

    function listNewProduct(
        string memory _productName,
        string memory _ipfsImageHash,
        uint256 _pricePerUnit,
        uint256 _quantityAvailable,
        string memory _unit
    ) external onlyFarmer {
        require(_pricePerUnit > 0, "Price must be greater than zero");
        require(_quantityAvailable > 0, "Quantity must be greater than zero");

        _tokenIdCounter.increment();
        uint256 newTokenId = _tokenIdCounter.current();

        _safeMint(msg.sender, newTokenId);
        allProductIds.push(newTokenId);

        productDetails[newTokenId] = ProductDetails({
            productName: _productName,
            ipfsImageHash: _ipfsImageHash,
            pricePerUnit: _pricePerUnit,
            quantityAvailable: _quantityAvailable,
            unit: _unit,
            dateHarvested: block.timestamp,
            farmer: msg.sender,
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

    function restoreQuantity(uint256 _productId, uint256 _amount) external {
        require(msg.sender == agreementContractAddress, "Only AgreementContract can call this");
        ProductDetails storage product = productDetails[_productId];
        product.quantityAvailable += _amount;
        product.isForSale = true;
    }
    
    function setAgreementContract(address _address) external onlyOwner {
        agreementContractAddress = _address;
    }
    
    function getTotalProducts() external view returns (uint256) {
        return allProductIds.length;
    }

    function getProductIds(uint256 page, uint256 limit) external view returns (uint256[] memory) {
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
    struct ProductInfo {
        uint256 id;
        address owner;
        string productName;
        string ipfsImageHash;
        uint256 pricePerUnit;
        uint256 quantityAvailable;
        string unit;
        uint256 dateHarvested;
        address farmer;
        bool isForSale;
    }

    function getAllProductsPaginated(uint256 page, uint256 limit) external view returns (ProductInfo[] memory) {
        uint256 total = allProductIds.length;
        if(page == 0) page = 1;
        uint256 startIndex = (page - 1) * limit;
        
        if (startIndex >= total) {
            return new ProductInfo[](0);
        }
        
        uint256 endIndex = startIndex + limit;
        if (endIndex > total) {
            endIndex = total;
        }
        
        ProductInfo[] memory batch = new ProductInfo[](endIndex - startIndex);
        uint256 counter = 0;
        
        for (uint256 i = startIndex; i < endIndex; i++) {
            uint256 tokenId = allProductIds[i];
            ProductDetails memory details = productDetails[tokenId];
            address owner = ownerOf(tokenId);
            
            batch[counter] = ProductInfo({
                id: tokenId,
                owner: owner,
                productName: details.productName,
                ipfsImageHash: details.ipfsImageHash,
                pricePerUnit: details.pricePerUnit,
                quantityAvailable: details.quantityAvailable,
                unit: details.unit,
                dateHarvested: details.dateHarvested,
                farmer: details.farmer,
                isForSale: details.isForSale
            });
            counter++;
        }
        
        return batch;
    }
}