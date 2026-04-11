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
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Track a Product</h1>
                <p className="text-muted-foreground mt-1">View the full supply chain history for any product on-chain.</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <form onSubmit={handleTrackProduct} className="flex gap-3">
                    <input
                        type="number"
                        value={productId}
                        onChange={(e) => setProductId(e.target.value)}
                        placeholder="Enter Product ID (e.g., 1)"
                        className="grow px-4 py-2 text-foreground bg-secondary border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none placeholder:text-muted-foreground transition-colors"
                    />
                    <button type="submit" disabled={loading} className="px-6 py-2 font-semibold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">
                        {loading ? "Searching..." : "Track"}
                    </button>
                </form>
                {error && <p className="text-sm text-destructive mt-3">{error}</p>}
            </div>

            {history.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-foreground mb-6">
                        History for Product <span className="text-primary">#{productId}</span>
                    </h2>
                    <div className="border-l-2 border-border pl-6 space-y-6 ml-2">
                        {history.map((update, index) => (
                            <div key={index} className="relative">
                                <div className="absolute -left-[29px] top-1 w-3.5 h-3.5 bg-primary rounded-full border-4 border-card" />
                                <p className="font-semibold text-foreground">{update.status}</p>
                                <p className="text-muted-foreground text-sm">{update.location}</p>
                                <p className="text-xs text-muted-foreground/60 mt-0.5">
                                    {new Date(update.timestamp * 1000).toLocaleString()}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}