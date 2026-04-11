"use client";

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import {
    AGREEMENT_CONTRACT_ADDRESS,
    AGREEMENT_CONTRACT_ABI,
} from '../../constants';
import { checkAndSwitchNetwork } from '../../utils/network';

const STATE_LABELS = {
    0: { label: 'Awaiting Delivery', className: 'text-yellow-500' },
    1: { label: 'Delivery Confirmed', className: 'text-blue-500' },
    2: { label: 'Completed', className: 'text-green-500' },
    3: { label: 'Disputed', className: 'text-destructive' },
    4: { label: 'Refunded', className: 'text-purple-500' },
    5: { label: 'Cancelled', className: 'text-muted-foreground' },
};

function AgreementDetail({ agreement, onResolve, resolveLoading, feedback }) {
    const state = Number(agreement.state);
    const stateInfo = STATE_LABELS[state] || { label: 'Unknown', className: 'text-muted-foreground' };
    const isDisputed = state === 3;
    const agId = agreement.agreementId;

    return (
        <div className="mt-4 p-5 bg-secondary/50 border border-border rounded-xl space-y-4">
            <div className="flex items-center justify-between">
                <p className="font-semibold text-foreground">Agreement #{String(agId)}</p>
                <span className={`text-xs font-medium ${stateInfo.className}`}>{stateInfo.label}</span>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div>
                    <p className="text-muted-foreground text-xs">Product ID</p>
                    <p className="text-foreground font-medium">#{String(agreement.productId)}</p>
                </div>
                <div>
                    <p className="text-muted-foreground text-xs">Value Locked</p>
                    <p className="text-primary font-semibold">{ethers.formatEther(agreement.totalValue)} ETH</p>
                </div>
                <div>
                    <p className="text-muted-foreground text-xs">Quantity</p>
                    <p className="text-foreground font-medium">{String(agreement.quantityPurchased)}</p>
                </div>
                <div>
                    <p className="text-muted-foreground text-xs">Created</p>
                    <p className="text-foreground text-xs">{new Date(Number(agreement.createdAt) * 1000).toLocaleString()}</p>
                </div>
                <div className="col-span-2">
                    <p className="text-muted-foreground text-xs">Buyer</p>
                    <p className="text-foreground font-mono text-xs break-all">{agreement.buyer}</p>
                </div>
                <div className="col-span-2">
                    <p className="text-muted-foreground text-xs">Seller</p>
                    <p className="text-foreground font-mono text-xs break-all">{agreement.seller}</p>
                </div>
            </div>

            {isDisputed && (
                <div className="pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-3">Choose a resolution — this action is irreversible:</p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => onResolve(agId, true)}
                            disabled={!!resolveLoading}
                            className="flex-1 py-2 px-3 text-sm font-medium rounded-lg bg-secondary text-foreground border border-border hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {resolveLoading === `${agId}-true` ? 'Processing...' : `Refund Buyer`}
                        </button>
                        <button
                            onClick={() => onResolve(agId, false)}
                            disabled={!!resolveLoading}
                            className="flex-1 py-2 px-3 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {resolveLoading === `${agId}-false` ? 'Processing...' : `Pay Seller`}
                        </button>
                    </div>
                    {feedback && (
                        <p className={`text-xs text-center mt-2 ${feedback.startsWith('Error') ? 'text-destructive' : 'text-green-500'}`}>
                            {feedback}
                        </p>
                    )}
                </div>
            )}

            {!isDisputed && (
                <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                    Not in a disputed state — no action needed.
                </p>
            )}
        </div>
    );
}

export default function AdminPage() {
    const [walletAddress, setWalletAddress] = useState('');
    const [contractOwner, setContractOwner] = useState('');
    const [isOwner, setIsOwner] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [searchId, setSearchId] = useState('');
    const [searchedAgreement, setSearchedAgreement] = useState(null);
    const [searchError, setSearchError] = useState('');
    const [searchLoading, setSearchLoading] = useState(false);

    const [disputedList, setDisputedList] = useState([]);
    const [disputesLoading, setDisputesLoading] = useState(false);

    const [resolveLoading, setResolveLoading] = useState(null);
    const [resolveFeedback, setResolveFeedback] = useState({});
    const [refreshKey, setRefreshKey] = useState(0);

    const initPage = useCallback(async () => {
        if (typeof window.ethereum === 'undefined') { setError('MetaMask is not installed.'); setLoading(false); return; }
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const isCorrect = await checkAndSwitchNetwork(provider);
            if (!isCorrect) { setError('Wrong network.'); setLoading(false); return; }

            const signer = await provider.getSigner();
            const address = await signer.getAddress();
            setWalletAddress(address);

            const agreementContract = new ethers.Contract(AGREEMENT_CONTRACT_ADDRESS, AGREEMENT_CONTRACT_ABI, provider);
            const owner = await agreementContract.owner();
            setContractOwner(owner);
            setIsOwner(address.toLowerCase() === owner.toLowerCase());
        } catch (err) {
            setError('Failed to connect. Make sure wallet is connected.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { initPage(); }, [initPage]);

    const scanDisputed = useCallback(async () => {
        if (!isOwner) return;
        setDisputesLoading(true);
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const agreementContract = new ethers.Contract(AGREEMENT_CONTRACT_ADDRESS, AGREEMENT_CONTRACT_ABI, provider);
            const total = Number(await agreementContract.totalAgreements());
            const disputed = [];
            for (let i = 1; i <= total; i++) {
                const ag = await agreementContract.getAgreement(i);
                if (Number(ag.state) === 3) disputed.push(ag);
            }
            setDisputedList(disputed);
        } catch (err) {
            console.error('Failed to scan disputes:', err);
        } finally {
            setDisputesLoading(false);
        }
    }, [isOwner, refreshKey]);

    useEffect(() => { scanDisputed(); }, [scanDisputed]);

    const handleSearch = async () => {
        if (!searchId || isNaN(Number(searchId))) { setSearchError('Enter a valid agreement ID.'); return; }
        setSearchLoading(true);
        setSearchedAgreement(null);
        setSearchError('');
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const agreementContract = new ethers.Contract(AGREEMENT_CONTRACT_ADDRESS, AGREEMENT_CONTRACT_ABI, provider);
            const ag = await agreementContract.getAgreement(Number(searchId));
            if (ag.buyer === ethers.ZeroAddress) setSearchError('Agreement not found.');
            else setSearchedAgreement(ag);
        } catch (err) {
            setSearchError('Failed to fetch agreement.');
        } finally {
            setSearchLoading(false);
        }
    };

    const handleResolve = async (agreementId, refundBuyer) => {
        const key = `${agreementId}-${refundBuyer}`;
        setResolveLoading(key);
        setResolveFeedback((prev) => ({ ...prev, [agreementId]: '' }));
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const isCorrect = await checkAndSwitchNetwork(provider);
            if (!isCorrect) throw new Error('Wrong network');

            const signer = await provider.getSigner();
            const agreementContract = new ethers.Contract(AGREEMENT_CONTRACT_ADDRESS, AGREEMENT_CONTRACT_ABI, signer);
            const tx = await agreementContract.resolveDispute(agreementId, refundBuyer);
            await tx.wait();

            setResolveFeedback((prev) => ({
                ...prev,
                [agreementId]: refundBuyer ? 'Buyer refunded successfully.' : 'Payment released to seller.',
            }));
            setRefreshKey((k) => k + 1);
            setSearchedAgreement(null);
        } catch (err) {
            const msg = err.reason || (err.code === 'ACTION_REJECTED' ? 'Transaction rejected.' : 'Failed to resolve.');
            setResolveFeedback((prev) => ({ ...prev, [agreementId]: `Error: ${msg}` }));
        } finally {
            setResolveLoading(null);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-muted-foreground text-sm">Verifying wallet...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="flex justify-center p-10">
            <div className="bg-destructive/10 text-destructive p-4 rounded-xl border border-destructive/20 max-w-md text-center">{error}</div>
        </div>
    );

    if (!isOwner) return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="bg-card border border-border rounded-xl p-10 text-center max-w-md shadow-sm">
                <ShieldAlert className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h1 className="text-xl font-bold text-foreground mb-2">Access Denied</h1>
                <p className="text-muted-foreground text-sm mb-4">This page is only accessible to the contract owner.</p>
                <p className="text-xs text-muted-foreground/60 font-mono break-all mb-1">Owner: {contractOwner}</p>
                <p className="text-xs text-muted-foreground/60 font-mono break-all">Your wallet: {walletAddress}</p>
                <Link href="/" className="inline-block mt-6 px-4 py-2 bg-secondary text-foreground rounded-lg text-sm hover:bg-secondary/80 transition-colors border border-border">
                    Back to Dashboard
                </Link>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin Panel</h1>
                        <span className="px-2.5 py-0.5 text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20 rounded-full">Owner</span>
                    </div>
                    <p className="text-muted-foreground">Dispute resolution center — review and settle disputed escrow agreements.</p>
                </div>
            </div>

            {/* Lookup */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <h2 className="text-base font-semibold text-foreground mb-4">Look Up Agreement</h2>
                <div className="flex gap-3">
                    <input
                        type="number"
                        value={searchId}
                        onChange={(e) => setSearchId(e.target.value)}
                        placeholder="Agreement ID"
                        className="flex-1 px-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button
                        onClick={handleSearch}
                        disabled={searchLoading}
                        className="px-5 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                        {searchLoading ? 'Searching...' : 'Search'}
                    </button>
                </div>
                {searchError && <p className="text-destructive text-sm mt-2">{searchError}</p>}
                {searchedAgreement && (
                    <AgreementDetail
                        agreement={searchedAgreement}
                        onResolve={handleResolve}
                        resolveLoading={resolveLoading}
                        feedback={resolveFeedback[searchedAgreement.agreementId]}
                    />
                )}
            </div>

            {/* Open disputes */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <h2 className="text-base font-semibold text-foreground">Open Disputes</h2>
                        {disputedList.length > 0 && (
                            <span className="px-2 py-0.5 text-xs bg-destructive/10 text-destructive border border-destructive/20 rounded-full">
                                {disputedList.length}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={scanDisputed}
                        disabled={disputesLoading}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                    >
                        {disputesLoading ? 'Scanning...' : 'Refresh'}
                    </button>
                </div>

                {disputesLoading && <p className="text-muted-foreground text-sm animate-pulse">Scanning all agreements...</p>}

                {!disputesLoading && disputedList.length === 0 && (
                    <p className="text-muted-foreground text-sm">No open disputes found.</p>
                )}

                {!disputesLoading && disputedList.map((ag) => (
                    <AgreementDetail
                        key={String(ag.agreementId)}
                        agreement={ag}
                        onResolve={handleResolve}
                        resolveLoading={resolveLoading}
                        feedback={resolveFeedback[ag.agreementId]}
                    />
                ))}
            </div>
        </div>
    );
}
