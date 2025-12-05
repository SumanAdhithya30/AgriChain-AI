"use client";

import { useState } from 'react';
import { ethers } from 'ethers';
import { REGISTRY_CONTRACT_ADDRESS, REGISTRY_CONTRACT_ABI } from '../../constants';
import { checkAndSwitchNetwork } from '../../utils/network';

export default function RegisterPage() {
    // NEW: State for all profile fields
    const [profile, setProfile] = useState({
        name: '',
        location: '',
        contactInfo: '',
        licenseOrId: ''
    });
    const [selectedRole, setSelectedRole] = useState(1); // Default to Farmer
    const [isLoading, setIsLoading] = useState(false);
    const [feedback, setFeedback] = useState("");

    // A helper function to handle input changes for the profile
    const handleProfileChange = (e) => {
        setProfile({
            ...profile,
            [e.target.name]: e.target.value
        });
    };

    const handleRegister = async () => {
        if (!profile.name || !profile.location || !selectedRole) {
            setFeedback("Please fill out at least Name and Location.");
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

            const isCorrectNetwork = await checkAndSwitchNetwork(provider);
            if (!isCorrectNetwork) {
                setFeedback("Please switch to the correct network.");
                setIsLoading(false);
                return;
            }

            const signer = await provider.getSigner();

            const registryContract = new ethers.Contract(
                REGISTRY_CONTRACT_ADDRESS,
                REGISTRY_CONTRACT_ABI,
                signer
            );

            // UPDATED: Pass the role and the entire profile object
            const tx = await registryContract.registerUser(selectedRole, profile);
            
            setFeedback("Transaction sent! Waiting for confirmation...");
            await tx.wait();
            
            setFeedback(`Success! "${profile.name}" has been registered on the blockchain.`);
        } catch (error) {
            console.error("Registration failed:", error);
            const reason = error.reason || "An error occurred during registration.";
            if (reason.includes("User is already registered.")) {
                 setFeedback("Error: This wallet address is already registered.");
            } else if (reason.includes("Name cannot be empty.")) {
                setFeedback("Error: Name is a required field.");
            } else {
                 setFeedback(`Error: ${reason}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-900 text-white">
            <div className="w-full max-w-2xl p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg">
                <h1 className="text-3xl font-bold text-center">Register Your Profile</h1>
                <p className="text-center text-gray-400">
                    Create your identity on the AgriChain platform to get started.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Role Selection */}
                    <div className="md:col-span-2">
                        <label htmlFor="role" className="block text-sm font-medium">Select your role:</label>
                        <select id="role" value={selectedRole} onChange={(e) => setSelectedRole(Number(e.target.value))} className="mt-1 w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md" disabled={isLoading}>
                            <option value={1}>Farmer</option>
                            <option value={2}>Buyer</option>
                            <option value={3}>Logistics Provider</option>
                        </select>
                    </div>
                    
                    {/* Name Input */}
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium">Name / Company Name</label>
                        <input id="name" name="name" type="text" value={profile.name} onChange={handleProfileChange} className="mt-1 w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md" placeholder="e.g., Green Valley Farms" disabled={isLoading} />
                    </div>
                    
                    {/* Location Input */}
                    <div>
                        <label htmlFor="location" className="block text-sm font-medium">Location</label>
                        <input id="location" name="location" type="text" value={profile.location} onChange={handleProfileChange} className="mt-1 w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md" placeholder="e.g., Nashik, Maharashtra" disabled={isLoading} />
                    </div>

                    {/* Contact Info Input */}
                    <div>
                        <label htmlFor="contactInfo" className="block text-sm font-medium">Contact Info (Website/Email)</label>
                        <input id="contactInfo" name="contactInfo" type="text" value={profile.contactInfo} onChange={handleProfileChange} className="mt-1 w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md" placeholder="e.g., www.greenvalley.com" disabled={isLoading} />
                    </div>

                    {/* License Input */}
                    <div>
                        <label htmlFor="licenseOrId" className="block text-sm font-medium">Certification / Business ID</label>
                        <input id="licenseOrId" name="licenseOrId" type="text" value={profile.licenseOrId} onChange={handleProfileChange} className="mt-1 w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md" placeholder="e.g., FSSAI #12345" disabled={isLoading} />
                    </div>
                </div>
                
                <button
                    onClick={handleRegister}
                    className="w-full px-4 py-3 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-500"
                    disabled={isLoading}
                >
                    {isLoading ? "Registering..." : "Register Profile"}
                </button>

                {feedback && (
                    <p className="text-center text-sm text-gray-300 mt-4">{feedback}</p>
                )}
            </div>
        </main>
    );
}