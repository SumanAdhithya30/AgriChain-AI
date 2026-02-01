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
        <div className="min-h-screen p-8 font-sans">
            <div className="container mx-auto max-w-2xl">
                <h1 className="text-4xl font-bold text-center mb-8 text-foreground">Track Your Product</h1>
                <form onSubmit={handleTrackProduct} className="flex gap-4 mb-12">
                    <input
                        type="number"
                        value={productId}
                        onChange={(e) => setProductId(e.target.value)}
                        placeholder="Enter Product ID (e.g., 1)"
                        className="grow px-4 py-2 text-foreground bg-secondary border border-border rounded-md focus:ring-2 focus:ring-primary outline-none placeholder:text-muted-foreground"
                    />
                    <button type="submit" disabled={loading} className="px-6 py-2 font-semibold text-primary-foreground bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors">
                        {loading ? "Searching..." : "Track"}
                    </button>
                </form>

                {error && <p className="text-center text-destructive mb-8">{error}</p>}

                {history.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-foreground">History for Product #{productId}</h2>
                        <div className="border-l-2 border-border pl-6 space-y-8 ml-3">
                            {history.map((update, index) => (
                                <div key={index} className="relative">
                                    <div className="absolute -left-[31px] top-1 w-4 h-4 bg-primary rounded-full border-4 border-background"></div>
                                    <p className="font-bold text-lg text-primary">{update.status}</p>
                                    <p className="text-foreground">{update.location}</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {new Date(update.timestamp * 1000).toLocaleString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}