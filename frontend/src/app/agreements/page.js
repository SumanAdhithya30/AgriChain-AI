"use client";

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import Link from 'next/link';
import {
    AGREEMENT_CONTRACT_ADDRESS,
    AGREEMENT_CONTRACT_ABI,
} from '../../constants';
import { checkAndSwitchNetwork } from '../../utils/network';

const STATE_LABELS = {
    0: { label: 'Awaiting Delivery', className: 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' },
    1: { label: 'Delivery Confirmed', className: 'bg-blue-500/10 text-blue-500 border border-blue-500/20' },
    2: { label: 'Completed', className: 'bg-green-500/10 text-green-500 border border-green-500/20' },
    3: { label: 'Disputed', className: 'bg-destructive/10 text-destructive border border-destructive/20' },
    4: { label: 'Refunded', className: 'bg-purple-500/10 text-purple-500 border border-purple-500/20' },
    5: { label: 'Cancelled', className: 'bg-secondary text-muted-foreground border border-border' },
};

function AgreementCard({ agreement, role, onAction }) {
    const [actionLoading, setActionLoading] = useState(null);
    const [feedback, setFeedback] = useState('');
    const state = Number(agreement.state);
    const stateInfo = STATE_LABELS[state] || { label: 'Unknown', className: 'bg-secondary text-muted-foreground border border-border' };

    const handleAction = async (actionName) => {
        setActionLoading(actionName);
        setFeedback('');
        try {
            await onAction(agreement.agreementId, actionName);
            setFeedback('Transaction confirmed!');
        } catch (err) {
            if (err.reason) setFeedback(`Error: ${err.reason}`);
            else if (err.code === 'ACTION_REJECTED') setFeedback('Transaction rejected.');
            else setFeedback('Transaction failed.');
            console.error(err);
        } finally {
            setActionLoading(null);
        }
    };

    const isBuyer = role === 'buyer';
    const isSeller = role === 'seller';

    return (
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4 shadow-sm transition-all duration-200 hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Agreement #{String(agreement.agreementId)}</p>
                    <Link href={`/product/${agreement.productId}`} className="font-semibold text-foreground hover:text-primary transition-colors text-sm">
                        Product #{String(agreement.productId)} &rarr;
                    </Link>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${stateInfo.className}`}>
                    {stateInfo.label}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm bg-secondary/50 rounded-lg p-3">
                <div>
                    <p className="text-muted-foreground text-xs">Quantity</p>
                    <p className="text-foreground font-medium">{String(agreement.quantityPurchased)}</p>
                </div>
                <div>
                    <p className="text-muted-foreground text-xs">Total Value</p>
                    <p className="text-primary font-semibold">{ethers.formatEther(agreement.totalValue)} ETH</p>
                </div>
                <div className="col-span-2">
                    <p className="text-muted-foreground text-xs">{isBuyer ? 'Seller' : 'Buyer'}</p>
                    <p className="text-foreground font-mono text-xs break-all">{isBuyer ? agreement.seller : agreement.buyer}</p>
                </div>
                <div className="col-span-2">
                    <p className="text-muted-foreground text-xs">Created</p>
                    <p className="text-foreground text-xs">{new Date(Number(agreement.createdAt) * 1000).toLocaleString()}</p>
                </div>
            </div>

            {/* Buyer actions */}
            {isBuyer && state === 0 && (
                <div className="flex flex-col gap-2 pt-2 border-t border-border">
                    <button
                        onClick={() => handleAction('confirmDelivery')}
                        disabled={!!actionLoading}
                        className="w-full py-2 px-4 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {actionLoading === 'confirmDelivery' ? 'Confirming...' : 'Confirm Delivery'}
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleAction('raiseDispute')}
                            disabled={!!actionLoading}
                            className="flex-1 py-2 px-3 text-sm font-medium rounded-lg bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {actionLoading === 'raiseDispute' ? 'Raising...' : 'Raise Dispute'}
                        </button>
                        <button
                            onClick={() => handleAction('cancelAgreement')}
                            disabled={!!actionLoading}
                            className="flex-1 py-2 px-3 text-sm font-medium rounded-lg bg-secondary text-muted-foreground border border-border hover:text-foreground hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {actionLoading === 'cancelAgreement' ? 'Cancelling...' : 'Cancel & Refund'}
                        </button>
                    </div>
                </div>
            )}

            {/* Seller action */}
            {isSeller && state === 1 && (
                <div className="pt-2 border-t border-border">
                    <button
                        onClick={() => handleAction('settlePayment')}
                        disabled={!!actionLoading}
                        className="w-full py-2 px-4 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {actionLoading === 'settlePayment' ? 'Settling...' : `Claim Payment — ${ethers.formatEther(agreement.totalValue)} ETH`}
                    </button>
                </div>
            )}

            {state === 3 && (
                <p className="text-xs text-center text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 rounded-lg py-2 px-3">
                    Dispute raised — awaiting admin resolution.
                </p>
            )}

            {feedback && (
                <p className={`text-xs text-center ${feedback.startsWith('Error') || feedback === 'Transaction rejected.' ? 'text-destructive' : 'text-green-500'}`}>
                    {feedback}
                </p>
            )}
        </div>
    );
}

export default function AgreementsPage() {
    const [activeTab, setActiveTab] = useState('purchases');
    const [purchases, setPurchases] = useState([]);
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [walletAddress, setWalletAddress] = useState('');
    const [refreshKey, setRefreshKey] = useState(0);

    const fetchAgreements = useCallback(async () => {
        if (typeof window.ethereum === 'undefined') { setError('MetaMask is not installed.'); return; }
        setLoading(true);
        setError('');
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const isCorrect = await checkAndSwitchNetwork(provider);
            if (!isCorrect) { setError('Please switch to the correct network.'); return; }

            const signer = await provider.getSigner();
            const address = await signer.getAddress();
            setWalletAddress(address);

            const agreementContract = new ethers.Contract(AGREEMENT_CONTRACT_ADDRESS, AGREEMENT_CONTRACT_ABI, provider);
            const [buyerIds, sellerIds] = await Promise.all([
                agreementContract.getAgreementsByBuyer(address),
                agreementContract.getAgreementsBySeller(address),
            ]);

            const fetchDetails = (ids) => Promise.all(ids.map((id) => agreementContract.getAgreement(id)));
            const [buyerAgreements, sellerAgreements] = await Promise.all([fetchDetails(buyerIds), fetchDetails(sellerIds)]);

            setPurchases([...buyerAgreements].reverse());
            setSales([...sellerAgreements].reverse());
        } catch (err) {
            console.error('Failed to fetch agreements:', err);
            setError('Failed to load agreements. Make sure your wallet is connected.');
        } finally {
            setLoading(false);
        }
    }, [refreshKey]);

    useEffect(() => { fetchAgreements(); }, [fetchAgreements]);

    const handleAction = async (agreementId, actionName) => {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const isCorrect = await checkAndSwitchNetwork(provider);
        if (!isCorrect) throw new Error('Wrong network');

        const signer = await provider.getSigner();
        const agreementContract = new ethers.Contract(AGREEMENT_CONTRACT_ADDRESS, AGREEMENT_CONTRACT_ABI, signer);

        let tx;
        if (actionName === 'confirmDelivery') tx = await agreementContract.confirmDelivery(agreementId);
        else if (actionName === 'settlePayment') tx = await agreementContract.settlePayment(agreementId);
        else if (actionName === 'cancelAgreement') tx = await agreementContract.cancelAgreement(agreementId);
        else if (actionName === 'raiseDispute') tx = await agreementContract.raiseDispute(agreementId);
        else throw new Error('Unknown action');

        await tx.wait();
        setRefreshKey((k) => k + 1);
    };

    const displayedAgreements = activeTab === 'purchases' ? purchases : sales;
    const role = activeTab === 'purchases' ? 'buyer' : 'seller';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">My Agreements</h1>
                <p className="text-muted-foreground mt-1">Manage your escrow agreements — purchases and sales.</p>
                {walletAddress && <p className="text-xs text-muted-foreground/60 mt-0.5 font-mono">{walletAddress}</p>}
            </div>

            {/* Escrow info */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                <p className="text-sm font-medium text-foreground mb-2">How Escrow Works</p>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Buyer pays — funds locked in the smart contract</li>
                    <li>Buyer confirms delivery when goods arrive</li>
                    <li>Seller claims payment after delivery is confirmed</li>
                    <li>Buyer can cancel (before confirmation) for a full refund, or raise a dispute for admin review</li>
                </ol>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-secondary/50 border border-border p-1 rounded-xl w-fit">
                {[
                    { key: 'purchases', label: 'Purchases', count: purchases.length },
                    { key: 'sales', label: 'Sales', count: sales.length },
                ].map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                            activeTab === tab.key
                                ? 'bg-card text-foreground shadow-sm border border-border'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        {tab.label}
                        {tab.count > 0 && (
                            <span className="ml-2 text-xs bg-primary/10 text-primary rounded-full px-1.5 py-0.5">{tab.count}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading && (
                <div className="flex items-center justify-center py-16">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        <p className="text-muted-foreground text-sm">Loading agreements...</p>
                    </div>
                </div>
            )}

            {error && !loading && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-destructive text-sm flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={fetchAgreements} className="underline hover:no-underline text-xs ml-4">Retry</button>
                </div>
            )}

            {!loading && !error && displayedAgreements.length === 0 && (
                <div className="bg-card border border-border rounded-xl p-16 text-center shadow-sm">
                    <p className="text-muted-foreground">
                        {activeTab === 'purchases' ? 'No purchases yet.' : 'No sales yet.'}
                    </p>
                    {activeTab === 'purchases' && (
                        <Link href="/marketplace" className="inline-block mt-4 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                            Browse Marketplace
                        </Link>
                    )}
                </div>
            )}

            {!loading && !error && displayedAgreements.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {displayedAgreements.map((agreement) => (
                        <AgreementCard
                            key={String(agreement.agreementId)}
                            agreement={agreement}
                            role={role}
                            onAction={handleAction}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
