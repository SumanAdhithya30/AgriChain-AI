// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./ProductContract.sol";

contract AgreementContract {
    ProductContract public immutable productContract;
    uint256 private _agreementIdCounter;

    enum AgreementState { CREATED, DELIVERED, CLOSED, DISPUTED }

    struct Agreement {
        uint256 agreementId;
        uint256 productId;
        uint256 quantityPurchased;
        address buyer;
        address seller;
        uint256 totalValue;
        AgreementState state;
    }

    mapping(uint256 => Agreement) public agreements;

    event AgreementCreated(uint256 indexed agreementId, uint256 indexed productId, uint256 quantity, uint256 totalValue);
    event DeliveryConfirmed(uint256 indexed agreementId);
    event PaymentSettled(uint256 indexed agreementId, address indexed seller, uint256 amount);

    constructor(address _productContractAddress) {
        productContract = ProductContract(_productContractAddress);
    }

    function createAgreement(uint256 _productId, uint256 _quantityToBuy) external payable {
        // This is the clean, warning-free way to get only the data we need.
        (
            , // productName
            , // ipfsImageHash
            uint256 pricePerUnit,
            uint256 quantityAvailable,
            , // unit
            , // dateHarvested
            , // farmer
            bool isForSale
        ) = productContract.productDetails(_productId);
        
        address seller = productContract.ownerOf(_productId);

        require(isForSale, "Product is not for sale (or is sold out).");
        require(quantityAvailable >= _quantityToBuy, "Not enough quantity available.");
        require(_quantityToBuy > 0, "Cannot buy zero quantity.");
        require(msg.sender != seller, "Buyer cannot be the seller.");

        uint256 totalValue = pricePerUnit * _quantityToBuy;
        require(msg.value == totalValue, "Payment must match the total value (price * quantity).");

        // Tell the ProductContract to update its inventory.
        productContract.decreaseQuantity(_productId, _quantityToBuy);

        _agreementIdCounter++;
        uint256 newAgreementId = _agreementIdCounter;

        agreements[newAgreementId] = Agreement({
            agreementId: newAgreementId,
            productId: _productId,
            quantityPurchased: _quantityToBuy,
            buyer: msg.sender,
            seller: seller,
            totalValue: totalValue,
            state: AgreementState.CREATED
        });

        emit AgreementCreated(newAgreementId, _productId, _quantityToBuy, totalValue);
    }

    function confirmDelivery(uint256 _agreementId) external {
        Agreement storage agreement = agreements[_agreementId];
        require(msg.sender == agreement.buyer, "Only the buyer can confirm delivery.");
        require(agreement.state == AgreementState.CREATED, "Agreement is not in a confirmable state.");
        agreement.state = AgreementState.DELIVERED;
        emit DeliveryConfirmed(_agreementId);
    }

    function settlePayment(uint256 _agreementId) external {
        Agreement storage agreement = agreements[_agreementId];
        require(msg.sender == agreement.seller, "Only the seller can settle payment.");
        require(agreement.state == AgreementState.DELIVERED, "Delivery has not been confirmed yet.");
        agreement.state = AgreementState.CLOSED;

        (bool sent, ) = agreement.seller.call{value: agreement.totalValue}("");
        require(sent, "Failed to send payment to the seller.");

        emit PaymentSettled(_agreementId, agreement.seller, agreement.totalValue);
    }
}