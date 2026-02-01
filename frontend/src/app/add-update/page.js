"use client";

import { useState } from 'react';
import { ethers } from 'ethers';
import { TRACEABILITY_CONTRACT_ADDRESS, TRACEABILITY_CONTRACT_ABI } from '../../constants';
import { checkAndSwitchNetwork } from '../../utils/network';

export default function AddUpdatePage() {
    const [formData, setFormData] = useState({
        productId: '',
        location: '',
        status: 'In Transit' // Default status
    });
    const [isLoading, setIsLoading] = useState(false);
    const [feedback, setFeedback] = useState("");
    
    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAddUpdate = async (e) => {
        e.preventDefault();
        const { productId, location, status } = formData;
        if (!productId || !location || !status) {
            setFeedback("Please fill out all fields.");
            return;
        }

        setIsLoading(true);
        setFeedback("Submitting update to the blockchain...");
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);

            const isCorrectNetwork = await checkAndSwitchNetwork(provider);
            if (!isCorrectNetwork) {
                setFeedback("Please switch to the correct network.");
                setIsLoading(false);
                return;
            }

            const signer = await provider.getSigner();
            const traceabilityContract = new ethers.Contract(
                TRACEABILITY_CONTRACT_ADDRESS,
                TRACEABILITY_CONTRACT_ABI,
                signer
            );

            // IMPORTANT: The user connected in MetaMask must be the owner of the contract.
            // In our local setup, this is "Account #0".
            const tx = await traceabilityContract.addTrackingUpdate(productId, location, status);
            
            setFeedback("Transaction sent! Waiting for confirmation...");
            await tx.wait();

            setFeedback(`Success! Tracking update for Product ID #${productId} has been recorded.`);
            setFormData({ productId: '', location: '', status: 'In Transit' }); // Clear form
        } catch (error) {
            console.error("Failed to add update:", error);
            if (error.reason) {
                setFeedback(`Error: ${error.reason}`);
            } else if (error.code === 'ACTION_REJECTED') {
                setFeedback("Transaction rejected in MetaMask.");
            } else {
                setFeedback("An error occurred. Check the console.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-8 font-sans">
            <div className="w-full max-w-lg p-8 space-y-6 bg-card border border-border rounded-xl shadow-lg">
                <h1 className="text-3xl font-bold text-center text-foreground">Add Tracking Update</h1>
                <p className="text-center text-muted-foreground">(Logistics Admin Panel)</p>

                <form onSubmit={handleAddUpdate} className="space-y-4">
                    <div>
                        <label htmlFor="productId" className="block text-sm font-medium text-foreground mb-1">Product ID</label>
                        <input
                            id="productId"
                            name="productId"
                            type="number"
                            value={formData.productId}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 text-foreground bg-secondary border border-border rounded-md focus:ring-2 focus:ring-primary outline-none"
                            placeholder="e.g., 1"
                            disabled={isLoading}
                        />
                    </div>
                    <div>
                        <label htmlFor="location" className="block text-sm font-medium text-foreground mb-1">Current Location</label>
                        <input
                            id="location"
                            name="location"
                            type="text"
                            value={formData.location}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 text-foreground bg-secondary border border-border rounded-md focus:ring-2 focus:ring-primary outline-none"
                            placeholder="e.g., Mumbai Warehouse"
                            disabled={isLoading}
                        />
                    </div>
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-foreground mb-1">Status</label>
                         <select id="status" name="status" value={formData.status} onChange={handleInputChange} className="w-full px-3 py-2 text-foreground bg-secondary border border-border rounded-md focus:ring-2 focus:ring-primary outline-none" disabled={isLoading}>
                            <option>In Transit</option>
                            <option>Warehouse</option>
                            <option>Out for Delivery</option>
                            <option>Delivered</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        className="w-full px-4 py-2 font-semibold text-primary-foreground bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
                        disabled={isLoading}
                    >
                        {isLoading ? "Submitting..." : "Add Update"}
                    </button>
                </form>

                {feedback && (
                    <p className="text-center text-sm text-muted-foreground mt-4 p-2 bg-secondary/50 rounded-md border border-border">{feedback}</p>
                )}
            </div>
        </div>
    );
}