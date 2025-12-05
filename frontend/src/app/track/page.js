"use client";

import { useState } from 'react';
import { ethers } from 'ethers';
import { TRACEABILITY_CONTRACT_ADDRESS, TRACEABILITY_CONTRACT_ABI } from '../../constants';
import { checkAndSwitchNetwork } from '../../utils/network';

export default function TrackPage() {
    const [productId, setProductId] = useState('');
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleTrackProduct = async (e) => {
        e.preventDefault();
        if (!productId) {
            setError("Please enter a Product ID.");
            return;
        }
        if (typeof window.ethereum === 'undefined') {
            setError("MetaMask is not installed.");
            return;
        }

        setLoading(true);
        setError('');
        setHistory([]);

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            
            const isCorrectNetwork = await checkAndSwitchNetwork(provider);
            if (!isCorrectNetwork) {
                setError("Please switch to the correct network.");
                setLoading(false);
                return;
            }

            const contract = new ethers.Contract(
                TRACEABILITY_CONTRACT_ADDRESS,
                TRACEABILITY_CONTRACT_ABI,
                provider
            );
            
            const historyResult = await contract.getTrackingHistory(productId);
            
            const formattedHistory = historyResult.map(update => ({
                timestamp: Number(update.timestamp),
                location: update.location,
                status: update.status
            })).sort((a, b) => b.timestamp - a.timestamp); // Sort with most recent first
            
            setHistory(formattedHistory);
            if (formattedHistory.length === 0) {
                setError("No tracking history found for this Product ID.");
            }

        } catch (err) {
            console.error("Failed to fetch history:", err);
            setError("An error occurred, or the Product ID is invalid.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen p-8 bg-gray-900 text-white">
            <div className="container mx-auto max-w-2xl">
                <h1 className="text-4xl font-bold text-center mb-8">Track Your Product</h1>
                <form onSubmit={handleTrackProduct} className="flex gap-4 mb-12">
                    <input
                        type="number"
                        value={productId}
                        onChange={(e) => setProductId(e.target.value)}
                        placeholder="Enter Product ID (e.g., 1)"
                        className="grow px-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-md"
                    />
                    <button type="submit" disabled={loading} className="px-6 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-500">
                        {loading ? "Searching..." : "Track"}
                    </button>
                </form>

                {error && <p className="text-center text-red-400">{error}</p>}

                {history.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold">History for Product #{productId}</h2>
                        <div className="border-l-2 border-gray-700 pl-6 space-y-8">
                            {history.map((update, index) => (
                                <div key={index} className="relative">
                                    <div className="absolute -left-8 top-1 w-4 h-4 bg-blue-500 rounded-full"></div>
                                    <p className="font-bold text-lg text-blue-300">{update.status}</p>
                                    <p className="text-gray-300">{update.location}</p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {new Date(update.timestamp * 1000).toLocaleString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}