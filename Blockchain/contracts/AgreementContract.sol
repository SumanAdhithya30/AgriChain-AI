// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// We need to interact with the ProductContract to verify that an NFT exists.
// We do this by importing its interface (or the full contract).
import "./ProductContract.sol";

/**
 * @title AgreementContract
 * @dev Manages the creation of agreements, escrow of funds, and final payment settlement.
 */
contract AgreementContract {

    //===========
    // State Variables
    //===========

    // A reference to the deployed ProductContract. This is how we interact with it.
    // We will set this address when we deploy this contract.
    ProductContract public immutable productContract;

    // A counter to generate unique IDs for each new agreement.
    uint256 private _agreementIdCounter;

    enum AgreementState {
        CREATED, // An agreement has been proposed and funds are in escrow.
        DELIVERED, // The buyer has confirmed delivery.
        CLOSED,    // The seller has been paid.
        DISPUTED   // The agreement is in a disputed state (future feature).
    }

    struct Agreement {
        uint256 agreementId;
        uint256 productId;    // The NFT token ID from the ProductContract.
        address buyer;
        address seller;
        uint256 price;
        AgreementState state;
    }

    // Mapping from an agreement ID to the Agreement struct.
    mapping(uint256 => Agreement) public agreements;

    //===========
    // Events
    //===========
    event AgreementCreated(uint256 indexed agreementId, uint256 indexed productId, address buyer, address seller, uint256 price);
    event DeliveryConfirmed(uint256 indexed agreementId);
    event PaymentSettled(uint256 indexed agreementId, address indexed seller, uint256 amount);

    //===========
    // Constructor
    //===========
    // When we deploy this contract, we MUST provide the address of the
    // already-deployed ProductContract.
    constructor(address _productContractAddress) {
        productContract = ProductContract(_productContractAddress);
    }

    //===========
    // Functions
    //===========

    /**
     * @dev Creates a new agreement and puts the buyer's funds into escrow.
     * The buyer must send the exact price of the item with the transaction.
     * @param _productId The ID of the product NFT being purchased.
     * @param _price The agreed-upon price in WEI (the smallest unit of Ether).
     */
    function createAgreement(uint256 _productId, uint256 _price) external payable {
        // payable keyword allows this function to receive cryptocurrency.
        
        // Check 1: Ensure the buyer sent the correct amount of funds.
        // msg.value is a global variable holding the amount of crypto sent.
        require(msg.value == _price, "Payment amount must match the agreed price.");

        // Check 2: Verify that the product NFT actually exists and get its owner.
        address seller = productContract.ownerOf(_productId);

        // Check 3: Ensure the buyer is not also the seller.
        require(msg.sender != seller, "Buyer cannot be the seller.");

        _agreementIdCounter++;
        uint256 newAgreementId = _agreementIdCounter;

        agreements[newAgreementId] = Agreement({
            agreementId: newAgreementId,
            productId: _productId,
            buyer: msg.sender,
            seller: seller,
            price: _price,
            state: AgreementState.CREATED
        });

        emit AgreementCreated(newAgreementId, _productId, msg.sender, seller, _price);
    }

    /**
     * @dev Allows the buyer to confirm the delivery of the product.
     * @param _agreementId The ID of the agreement to confirm.
     */
    function confirmDelivery(uint256 _agreementId) external {
        Agreement storage agreement = agreements[_agreementId];

        // Check 1: Only the buyer of this specific agreement can call this.
        require(msg.sender == agreement.buyer, "Only the buyer can confirm delivery.");

        // Check 2: The agreement must be in the 'CREATED' state.
        require(agreement.state == AgreementState.CREATED, "Agreement is not in a confirmable state.");

        agreement.state = AgreementState.DELIVERED;
        emit DeliveryConfirmed(_agreementId);
    }

    /**
     * @dev Allows the seller to withdraw the payment after delivery is confirmed.
     * Transfers the escrowed funds to the seller's wallet.
     * @param _agreementId The ID of the agreement to settle.
     */
    function settlePayment(uint256 _agreementId) external {
        Agreement storage agreement = agreements[_agreementId];
        
        // Check 1: Only the seller of this specific agreement can call this.
        require(msg.sender == agreement.seller, "Only the seller can settle payment.");

        // Check 2: The agreement must be in the 'DELIVERED' state.
        require(agreement.state == AgreementState.DELIVERED, "Delivery has not been confirmed yet.");

        agreement.state = AgreementState.CLOSED;

        // Securely transfer the funds to the seller.
        (bool sent, ) = agreement.seller.call{value: agreement.price}("");
        require(sent, "Failed to send payment to the seller.");

        emit PaymentSettled(_agreementId, agreement.seller, agreement.price);
    }
}