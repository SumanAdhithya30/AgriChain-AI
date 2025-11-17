"use client";

import { useState } from 'react';
import { ethers } from 'ethers';
import { PRODUCT_CONTRACT_ADDRESS, PRODUCT_CONTRACT_ABI } from '../../constants';

export default function ListProductPage() {
    const [productName, setProductName] = useState('');
    const [ipfsHash, setIpfsHash] = useState('');
    const [price, setPrice] = useState(''); // NEW: State for the price
    const [isLoading, setIsLoading] = useState(false);
    const [feedback, setFeedback] = useState("");

    const handleListProduct = async (e) => {
        e.preventDefault();

        // NEW: Check if price is also filled
        if (!productName || !ipfsHash || !price) {
            setFeedback("Please fill out all fields.");
            return;
        }
        if (typeof window.ethereum === 'undefined') {
            setFeedback("MetaMask is not installed.");
            return;
        }

        setIsLoading(true);
        setFeedback("Preparing transaction... Please confirm in MetaMask.");

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const farmerAddress = await signer.getAddress();

            const productContract = new ethers.Contract(
                PRODUCT_CONTRACT_ADDRESS,
                PRODUCT_CONTRACT_ABI,
                signer
            );

            // NEW: Convert the price from Ether (string) to Wei (BigInt)
            const priceInWei = ethers.parseEther(price);
            
            // NEW: Call the function with all four arguments
            const tx = await productContract.listNewProduct(farmerAddress, productName, ipfsHash, priceInWei);

            setFeedback("Transaction sent! Waiting for confirmation...");
            await tx.wait();
            
            setFeedback(`Success! Product "${productName}" has been listed for ${price} ETH.`);
            setProductName('');
            setIpfsHash('');
            setPrice(''); // NEW: Clear the price field
        } catch (error) {
            console.error("Product listing failed:", error);
            if (error.code === 'ACTION_REJECTED') {
                 setFeedback("Transaction rejected in MetaMask.");
            } else if (error.message.includes("caller is not the owner")) {
                setFeedback("Error: Only the contract deployer can list products in this prototype.");
            } else {
                 setFeedback("An error occurred during product listing.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-900 text-white">
            <div className="w-full max-w-lg p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg">
                <h1 className="text-3xl font-bold text-center">List a New Product</h1>
                <form onSubmit={handleListProduct} className="space-y-4">
                    <div>
                        <label htmlFor="productName" className="block text-sm font-medium">Product Name</label>
                        <input
                            id="productName"
                            type="text"
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                            className="mt-1 w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md"
                            placeholder="e.g., Organic Tomatoes"
                            disabled={isLoading}
                        />
                    </div>
                    <div>
                        <label htmlFor="ipfsHash" className="block text-sm font-medium">Image IPFS Hash</label>
                        <input
                            id="ipfsHash"
                            type="text"
                            value={ipfsHash}
                            onChange={(e) => setIpfsHash(e.target.value)}
                            className="mt-1 w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md"
                            placeholder="e.g., Qm..."
                            disabled={isLoading}
                        />
                    </div>
                    {/* NEW: Price Input Field */}
                    <div>
                        <label htmlFor="price" className="block text-sm font-medium">Price (in ETH)</label>
                        <input
                            id="price"
                            type="text" // Using text to allow for decimals like "0.5"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="mt-1 w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md"
                            placeholder="e.g., 0.1"
                            disabled={isLoading}
                        />
                    </div>
                    
                    <button
                        type="submit"
                        className="w-full px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-500"
                        disabled={isLoading}
                    >
                        {isLoading ? "Listing Product..." : "List Product"}
                    </button>
                </form>

                {feedback && (
                    <p className="text-center text-sm text-gray-300 mt-4">{feedback}</p>
                )}
            </div>
        </main>
    );
}