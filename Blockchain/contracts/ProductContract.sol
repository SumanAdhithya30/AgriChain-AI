// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract ProductContract is ERC721, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    struct ProductDetails {
        string productName;
        string ipfsImageHash;
        uint256 dateHarvested;
        address farmer;
    }

    mapping(uint256 => ProductDetails) public productDetails;

    // THIS LINE HAS BEEN CORRECTED
    constructor() ERC721("AgriChainProduct", "AGP") Ownable() {}

    function listNewProduct(
        address _farmer,
        string memory _productName,
        string memory _ipfsImageHash
    ) external {
        _tokenIdCounter.increment();
        uint256 newTokenId = _tokenIdCounter.current();
        _safeMint(_farmer, newTokenId);

        productDetails[newTokenId] = ProductDetails({
            productName: _productName,
            ipfsImageHash: _ipfsImageHash,
            dateHarvested: block.timestamp,
            farmer: _farmer
        });
    }
}