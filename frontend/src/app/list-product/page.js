"use client";

import { useState } from 'react';
import { ethers } from 'ethers';
import { PRODUCT_CONTRACT_ADDRESS, PRODUCT_CONTRACT_ABI } from '../../constants';

export default function ListProductPage() {
    const [formData, setFormData] = useState({
        productName: '',
        ipfsHash: '',
        pricePerUnit: '',
        quantity: '',
        unit: 'kg' // Default unit
    });
    const [isLoading, setIsLoading] = useState(false);
    const [feedback, setFeedback] = useState("");

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleListProduct = async (e) => {
        e.preventDefault();
        const { productName, ipfsHash, pricePerUnit, quantity, unit } = formData;

        if (!productName || !ipfsHash || !pricePerUnit || !quantity || !unit) {
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

            const productContract = new ethers.Contract(PRODUCT_CONTRACT_ADDRESS, PRODUCT_CONTRACT_ABI, signer);

            const priceInWei = ethers.parseEther(pricePerUnit);
            
            // CORRECTED: Call the function with 5 arguments.
            // The farmer's address is now automatically determined by msg.sender in the smart contract.
            const tx = await productContract.listNewProduct(productName, ipfsHash, priceInWei, quantity, unit);

            setFeedback("Transaction sent! Waiting for confirmation...");
            await tx.wait();
            
            setFeedback(`Success! Product "${productName}" listed with ${quantity} ${unit}.`);
            setFormData({ productName: '', ipfsHash: '', pricePerUnit: '', quantity: '', unit: 'kg' });
        } catch (error) {
            console.error("Product listing failed:", error);
            if (error.reason) setFeedback(`Error: ${error.reason}`);
            else if (error.code === 'ACTION_REJECTED') setFeedback("Transaction rejected.");
            else setFeedback("An error occurred during listing. You may not be a registered Farmer.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-900 text-white">
            <div className="w-full max-w-lg p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg">
                <h1 className="text-3xl font-bold text-center">List a New Product</h1>
                <p className="text-center text-gray-400">Register as a Farmer to list a product.</p>
                <form onSubmit={handleListProduct} className="space-y-4">
                    <div>
                        <label htmlFor="productName" className="block text-sm font-medium">Product Name</label>
                        <input name="productName" type="text" value={formData.productName} onChange={handleInputChange} className="mt-1 w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md" placeholder="e.g., Organic Tomatoes" disabled={isLoading} />
                    </div>
                    
                    <div>
                        <label htmlFor="ipfsHash" className="block text-sm font-medium">Image IPFS Hash</label>
                        <input name="ipfsHash" type="text" value={formData.ipfsHash} onChange={handleInputChange} className="mt-1 w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md" placeholder="e.g., Qm..." disabled={isLoading} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="pricePerUnit" className="block text-sm font-medium">Price (per Unit)</label>
                            <input name="pricePerUnit" type="text" value={formData.pricePerUnit} onChange={handleInputChange} className="mt-1 w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md" placeholder="e.g., 0.01 ETH" disabled={isLoading} />
                        </div>
                        <div>
                            <label htmlFor="quantity" className="block text-sm font-medium">Quantity</label>
                            <input name="quantity" type="number" value={formData.quantity} onChange={handleInputChange} className="mt-1 w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md" placeholder="e.g., 1000" disabled={isLoading} />
                        </div>
                        <div>
                            <label htmlFor="unit" className="block text-sm font-medium">Unit</label>
                            <select name="unit" value={formData.unit} onChange={handleInputChange} className="mt-1 w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md" disabled={isLoading}>
                                <option value="kg">kg</option>
                                <option value="ton">ton</option>
                                <option value="piece">piece</option>
                                <option value="liter">liter</option>
                            </select>
                        </div>
                    </div>
                    
                    <button type="submit" className="w-full px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-500" disabled={isLoading}>
                        {isLoading ? "Listing Product..." : "List Product"}
                    </button>
                </form>

                {feedback && <p className="text-center text-sm text-gray-300 mt-4">{feedback}</p>}
            </div>
        </main>
    );
}