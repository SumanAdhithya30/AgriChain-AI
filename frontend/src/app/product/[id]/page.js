"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { ethers } from 'ethers';
import { 
    PRODUCT_CONTRACT_ADDRESS, 
    PRODUCT_CONTRACT_ABI,
    AGREEMENT_CONTRACT_ADDRESS, // We now need this
    AGREEMENT_CONTRACT_ABI   // And this
} from '../../../constants';
import Link from 'next/link';

export default function ProductDetailPage() {
    const params = useParams();
    const productId = params.id;

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // NEW: State variables to manage the purchase process
    const [isBuying, setIsBuying] = useState(false);
    const [feedback, setFeedback] = useState('');

    const fetchProductDetails = useCallback(async () => {
        // ... This function stays exactly the same as before
        if (!productId) return;
        setLoading(true);
        setError('');
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const contract = new ethers.Contract(PRODUCT_CONTRACT_ADDRESS, PRODUCT_CONTRACT_ABI, provider);
            const owner = await contract.ownerOf(productId);
            const details = await contract.productDetails(productId);

            setProduct({
                id: productId,
                owner: owner,
                name: details.productName,
                ipfsHash: details.ipfsImageHash,
                price: details.price,
                isForSale: details.isForSale,
            });
        } catch (err) {
            console.error("Failed to fetch product details:", err);
            setError("Could not find this product or an error occurred.");
        } finally {
            setLoading(false);
        }
    }, [productId]);

    useEffect(() => {
        fetchProductDetails();
    }, [fetchProductDetails]);


    // NEW: The function to handle the purchase
    const handleBuyProduct = async () => {
        console.log("Attempting to buy product. Using AgreementContract address:", AGREEMENT_CONTRACT_ADDRESS);
        if (!product) return;
        
        setIsBuying(true);
        setFeedback("Preparing purchase... Please connect your wallet and confirm.");

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            // THE FIX IS HERE: We must use the AGREEMENT constants, not any others.
            const agreementContract = new ethers.Contract(
                AGREEMENT_CONTRACT_ADDRESS,
                AGREEMENT_CONTRACT_ABI,
                signer
            );
            
            setFeedback("Please confirm the transaction in MetaMask to send funds to escrow...");

            const tx = await agreementContract.createAgreement(
                product.id,
                product.price,
                { value: product.price }
            );

            setFeedback("Transaction sent! Waiting for confirmation from the blockchain...");
            await tx.wait();

            setFeedback("Success! Your funds are now securely held in escrow. The seller has been notified.");
            // We can now call our markAsSold function
            // (Note: we would need to add this logic later)
            fetchProductDetails(); 

        } catch(err) {
            console.error("Purchase failed:", err);
            // Give more specific feedback for common errors
            if (err.code === 'ACTION_REJECTED') {
                 setFeedback("Transaction was rejected in MetaMask.");
            } else if (err.reason) {
                 setFeedback(`Error: ${err.reason}`); // Show the revert reason from the contract
            } else {
                 setFeedback("An error occurred during purchase. Check the console.");
            }
        } finally {
            setIsBuying(false);
        }
    };

    if (loading) return <p className="text-center text-white p-10">Loading product...</p>;
    if (error) return <p className="text-center text-red-400 p-10">{error}</p>;
    if (!product) return <p className="text-center text-white p-10">Product not found.</p>;

    // The JSX is updated to use the new state variables
    return (
        <main className="min-h-screen p-8 bg-gray-900 text-white">
            <div className="container mx-auto max-w-4xl">
                <Link href="/marketplace" className="text-blue-400 hover:underline mb-8 block">&larr; Back to Marketplace</Link>
                
                <div className="bg-gray-800 rounded-lg shadow-lg p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-gray-700 w-full h-96 rounded-md flex items-center justify-center">
                        <p className="text-gray-500">Product Image Placeholder</p>
                    </div>

                    <div className="flex flex-col">
                        <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
                        <p className="text-2xl font-semibold text-green-400 mb-4">
                            {ethers.formatEther(product.price)} ETH
                        </p>
                        <div className="text-sm text-gray-400 space-y-2 mb-6">
                           <p><span className="font-bold">Token ID:</span> {product.id}</p> 
                           <p><span className="font-bold">Owner:</span> <span className="break-all">{product.owner}</span></p> 
                           <p><span className="font-bold">Status:</span> {product.isForSale ? "For Sale" : "Sold"}</p> 
                        </div>

                        <div className="mt-auto">
                            <button 
                                onClick={handleBuyProduct}
                                disabled={!product.isForSale || isBuying}
                                className="w-full px-6 py-3 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
                            >
                                {isBuying ? "Processing..." : (product.isForSale ? "Buy Now (Escrow)" : "This item has been sold")}
                            </button>
                             {feedback && <p className="text-center text-sm text-gray-300 mt-4">{feedback}</p>}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}