"use client";

import { useState } from 'react';
import { ethers } from 'ethers';
import { REGISTRY_CONTRACT_ADDRESS, REGISTRY_CONTRACT_ABI } from '../../constants';

export default function RegisterPage() {
    // State to hold the selected role
    const [selectedRole, setSelectedRole] = useState(1); // Default to Farmer (1)
    const [isLoading, setIsLoading] = useState(false);
    const [feedback, setFeedback] = useState("");

    const handleRegister = async () => {
        if (!selectedRole) {
            setFeedback("Please select a role.");
            return;
        }
        if (typeof window.ethereum === 'undefined') {
            setFeedback("MetaMask is not installed.");
            return;
        }

        setIsLoading(true);
        setFeedback("Preparing transaction... Please confirm in MetaMask.");

        try {
            // Get the provider and signer from MetaMask
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            // Create a new instance of the contract
            const registryContract = new ethers.Contract(
                REGISTRY_CONTRACT_ADDRESS,
                REGISTRY_CONTRACT_ABI,
                signer
            );

            // Call the registerUser function on the contract
            const tx = await registryContract.registerUser(selectedRole);
            
            setFeedback("Transaction sent! Waiting for confirmation...");
            
            // Wait for the transaction to be mined
            await tx.wait();
            
            setFeedback("Success! You have been registered on the blockchain.");
        } catch (error) {
            console.error("Registration failed:", error);
            // Give a more user-friendly error message
            if (error.code === 'ACTION_REJECTED') {
                 setFeedback("Transaction rejected in MetaMask.");
            } else if (error.message.includes("User is already registered.")) {
                 setFeedback("Error: This wallet address is already registered.");
            } else {
                 setFeedback("An error occurred during registration.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-900 text-white">
            <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg">
                <h1 className="text-3xl font-bold text-center">Register Your Role</h1>
                <p className="text-center text-gray-400">
                    Choose your role on the AgriChain platform to get started.
                </p>

                <div className="space-y-2">
                    <label htmlFor="role" className="text-sm font-medium">Select your role:</label>
                    <select
                        id="role"
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(Number(e.target.value))}
                        className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isLoading}
                    >
                        {/* Note: Enum values from Solidity: FARMER=1, BUYER=2, LOGISTICS_PROVIDER=3 */}
                        <option value={1}>Farmer</option>
                        <option value={2}>Buyer</option>
                        <option value={3}>Logistics Provider</option>
                    </select>
                </div>
                
                <button
                    onClick={handleRegister}
                    className="w-full px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                    disabled={isLoading}
                >
                    {isLoading ? "Registering..." : "Register on Blockchain"}
                </button>

                {feedback && (
                    <p className="text-center text-sm text-gray-300 mt-4">{feedback}</p>
                )}
            </div>
        </main>
    );
}