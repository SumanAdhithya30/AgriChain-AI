// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./ProductContract.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract AgreementContract is ReentrancyGuard {
    ProductContract public immutable productContract;
    address public immutable owner;
    uint256 private _agreementIdCounter;

    enum AgreementState { CREATED, DELIVERED, CLOSED, DISPUTED, REFUNDED, CANCELLED }

    struct Agreement {
        uint256 agreementId;
        uint256 productId;
        uint256 quantityPurchased;
        address buyer;
        address seller;
        uint256 totalValue;
        AgreementState state;
        uint256 createdAt;
    }

    mapping(uint256 => Agreement) public agreements;
    mapping(address => uint256[]) private buyerAgreements;
    mapping(address => uint256[]) private sellerAgreements;

    event AgreementCreated(uint256 indexed agreementId, uint256 indexed productId, uint256 quantity, uint256 totalValue);
    event DeliveryConfirmed(uint256 indexed agreementId);
    event PaymentSettled(uint256 indexed agreementId, address indexed seller, uint256 amount);
    event AgreementCancelled(uint256 indexed agreementId, address indexed buyer, uint256 refundAmount);
    event DisputeRaised(uint256 indexed agreementId, address indexed buyer);
    event DisputeResolved(uint256 indexed agreementId, bool refundedBuyer);

    modifier onlyContractOwner() {
        require(msg.sender == owner, "Only contract owner can call this");
        _;
    }

    constructor(address _productContractAddress) {
        productContract = ProductContract(_productContractAddress);
        owner = msg.sender;
    }

    function createAgreement(uint256 _productId, uint256 _quantityToBuy) external payable nonReentrant {
        (
            ,  // productName
            ,  // ipfsImageHash
            uint256 pricePerUnit,
            uint256 quantityAvailable,
            ,  // unit
            ,  // dateHarvested
            ,  // farmer
            bool isForSale
        ) = productContract.productDetails(_productId);

        address seller = productContract.ownerOf(_productId);

        require(isForSale, "Product is not for sale (or is sold out).");
        require(quantityAvailable >= _quantityToBuy, "Not enough quantity available.");
        require(_quantityToBuy > 0, "Cannot buy zero quantity.");
        require(msg.sender != seller, "Buyer cannot be the seller.");

        uint256 totalValue = pricePerUnit * _quantityToBuy;
        require(msg.value == totalValue, "Payment must match the total value (price * quantity).");

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
            state: AgreementState.CREATED,
            createdAt: block.timestamp
        });

        buyerAgreements[msg.sender].push(newAgreementId);
        sellerAgreements[seller].push(newAgreementId);

        emit AgreementCreated(newAgreementId, _productId, _quantityToBuy, totalValue);
    }

    function confirmDelivery(uint256 _agreementId) external {
        Agreement storage agreement = agreements[_agreementId];
        require(msg.sender == agreement.buyer, "Only the buyer can confirm delivery.");
        require(agreement.state == AgreementState.CREATED, "Agreement is not in a confirmable state.");
        agreement.state = AgreementState.DELIVERED;
        emit DeliveryConfirmed(_agreementId);
    }

    function settlePayment(uint256 _agreementId) external nonReentrant {
        Agreement storage agreement = agreements[_agreementId];
        require(msg.sender == agreement.seller, "Only the seller can settle payment.");
        require(agreement.state == AgreementState.DELIVERED, "Delivery has not been confirmed yet.");
        agreement.state = AgreementState.CLOSED;

        (bool sent, ) = agreement.seller.call{value: agreement.totalValue}("");
        require(sent, "Failed to send payment to the seller.");

        emit PaymentSettled(_agreementId, agreement.seller, agreement.totalValue);
    }

    function cancelAgreement(uint256 _agreementId) external nonReentrant {
        Agreement storage agreement = agreements[_agreementId];
        require(msg.sender == agreement.buyer, "Only the buyer can cancel.");
        require(agreement.state == AgreementState.CREATED, "Can only cancel an agreement awaiting delivery.");

        uint256 refundAmount = agreement.totalValue;
        uint256 productId = agreement.productId;
        uint256 quantity = agreement.quantityPurchased;
        agreement.state = AgreementState.CANCELLED;

        // Restore inventory so the product is available for other buyers
        productContract.restoreQuantity(productId, quantity);

        (bool sent, ) = agreement.buyer.call{value: refundAmount}("");
        require(sent, "Failed to refund buyer.");

        emit AgreementCancelled(_agreementId, agreement.buyer, refundAmount);
    }

    function raiseDispute(uint256 _agreementId) external {
        Agreement storage agreement = agreements[_agreementId];
        require(msg.sender == agreement.buyer, "Only the buyer can raise a dispute.");
        require(agreement.state == AgreementState.CREATED, "Can only dispute an agreement awaiting delivery.");

        agreement.state = AgreementState.DISPUTED;
        emit DisputeRaised(_agreementId, msg.sender);
    }

    function resolveDispute(uint256 _agreementId, bool _refundBuyer) external onlyContractOwner nonReentrant {
        Agreement storage agreement = agreements[_agreementId];
        require(agreement.state == AgreementState.DISPUTED, "Agreement is not in a disputed state.");

        if (_refundBuyer) {
            agreement.state = AgreementState.REFUNDED;
            (bool sent, ) = agreement.buyer.call{value: agreement.totalValue}("");
            require(sent, "Failed to refund buyer.");
        } else {
            agreement.state = AgreementState.CLOSED;
            (bool sent, ) = agreement.seller.call{value: agreement.totalValue}("");
            require(sent, "Failed to pay seller.");
        }

        emit DisputeResolved(_agreementId, _refundBuyer);
    }

    function getAgreement(uint256 _agreementId) external view returns (Agreement memory) {
        return agreements[_agreementId];
    }

    function getAgreementsByBuyer(address _buyer) external view returns (uint256[] memory) {
        return buyerAgreements[_buyer];
    }

    function getAgreementsBySeller(address _seller) external view returns (uint256[] memory) {
        return sellerAgreements[_seller];
    }

    function totalAgreements() external view returns (uint256) {
        return _agreementIdCounter;
    }
}
