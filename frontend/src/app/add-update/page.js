"use client";

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Link from 'next/link';
import { PackageSearch, ShieldX } from 'lucide-react';
import {
    TRACEABILITY_CONTRACT_ADDRESS, TRACEABILITY_CONTRACT_ABI,
    REGISTRY_CONTRACT_ADDRESS, REGISTRY_CONTRACT_ABI,
    PRODUCT_CONTRACT_ADDRESS, PRODUCT_CONTRACT_ABI,
} from '../../constants';
import { checkAndSwitchNetwork } from '../../utils/network';

const STATUS_OPTIONS = ['Picked Up', 'In Transit', 'Warehouse', 'Out for Delivery', 'Delivered'];

export default function AddUpdatePage() {
    // Role guard
    const [roleStatus, setRoleStatus] = useState('checking'); // checking | authorized | unauthorized | no-wallet
    const [roleName, setRoleName] = useState('');

    // Product lookup
    const [productId, setProductId] = useState('');
    const [productInfo, setProductInfo] = useState(null);
    const [productLoading, setProductLoading] = useState(false);
    const [productError, setProductError] = useState('');

    // Form
    const [location, setLocation] = useState('');
    const [status, setStatus] = useState('In Transit');
    const [isLoading, setIsLoading] = useState(false);
    const [feedback, setFeedback] = useState(null); // { type: 'success'|'error', msg }

    // ── Check role on mount ────────────────────────────────────────────────
    useEffect(() => {
        const check = async () => {
            if (typeof window.ethereum === 'undefined') { setRoleStatus('no-wallet'); return; }
            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const isCorrect = await checkAndSwitchNetwork(provider);
                if (!isCorrect) { setRoleStatus('unauthorized'); return; }

                const accounts = await provider.listAccounts();
                if (!accounts.length) { setRoleStatus('no-wallet'); return; }

                const registry = new ethers.Contract(REGISTRY_CONTRACT_ADDRESS, REGISTRY_CONTRACT_ABI, provider);
                const user = await registry.users(accounts[0].address);
                const isRegistered = user[2];
                const role = Number(user[1]);

                if (!isRegistered) { setRoleStatus('unauthorized'); return; }

                // Role 1 = Farmer, Role 3 = Logistics Provider — both allowed
                if (role === 3) { setRoleStatus('authorized'); setRoleName('Logistics Provider'); }
                else if (role === 1) { setRoleStatus('authorized'); setRoleName('Farmer'); }
                else { setRoleStatus('unauthorized'); setRoleName('Buyer'); }
            } catch { setRoleStatus('unauthorized'); }
        };
        check();
    }, []);

    // ── Look up product by ID ──────────────────────────────────────────────
    const handleLookup = async () => {
        if (!productId) return;
        setProductLoading(true);
        setProductError('');
        setProductInfo(null);
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const productContract = new ethers.Contract(PRODUCT_CONTRACT_ADDRESS, PRODUCT_CONTRACT_ABI, provider);
            const details = await productContract.productDetails(productId);
            if (!details.productName) { setProductError('Product not found.'); return; }
            setProductInfo({ name: details.productName, unit: details.unit, quantity: details.quantityAvailable });
        } catch {
            setProductError('Invalid product ID or not found.');
        } finally {
            setProductLoading(false);
        }
    };

    // ── Submit tracking update ─────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!productId || !location) { setFeedback({ type: 'error', msg: 'Please fill in all fields.' }); return; }

        setIsLoading(true);
        setFeedback(null);
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const isCorrect = await checkAndSwitchNetwork(provider);
            if (!isCorrect) { setFeedback({ type: 'error', msg: 'Wrong network.' }); return; }

            const signer = await provider.getSigner();
            const traceability = new ethers.Contract(TRACEABILITY_CONTRACT_ADDRESS, TRACEABILITY_CONTRACT_ABI, signer);
            const tx = await traceability.addTrackingUpdate(productId, location, status);
            setFeedback({ type: 'info', msg: 'Transaction sent! Waiting for confirmation...' });
            await tx.wait();

            setFeedback({ type: 'success', msg: `Update recorded for Product #${productId} — "${status}" at ${location}.` });
            setLocation('');
            setProductId('');
            setProductInfo(null);
        } catch (err) {
            if (err.code === 'ACTION_REJECTED') setFeedback({ type: 'error', msg: 'Transaction rejected.' });
            else if (err.reason) setFeedback({ type: 'error', msg: err.reason });
            else setFeedback({ type: 'error', msg: 'Transaction failed. Check console.' });
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    // ── Guard states ───────────────────────────────────────────────────────
    if (roleStatus === 'checking') return (
        <div className="flex items-center justify-center min-h-[40vh]">
            <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-muted-foreground text-sm">Checking your role...</p>
            </div>
        </div>
    );

    if (roleStatus === 'no-wallet') return (
        <div className="max-w-md mx-auto text-center py-16">
            <ShieldX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">Wallet Not Connected</h2>
            <p className="text-muted-foreground text-sm">Connect your wallet to access this page.</p>
        </div>
    );

    if (roleStatus === 'unauthorized') return (
        <div className="max-w-md mx-auto text-center py-16">
            <ShieldX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">Access Restricted</h2>
            <p className="text-muted-foreground text-sm mb-1">
                This page is only for <span className="text-foreground font-medium">Farmers</span> and <span className="text-foreground font-medium">Logistics Providers</span>.
            </p>
            {roleName === 'Buyer' && (
                <p className="text-muted-foreground text-sm mb-6">You are registered as a Buyer.</p>
            )}
            <Link href="/track" className="inline-block px-4 py-2 bg-secondary border border-border text-foreground text-sm rounded-lg hover:bg-secondary/80 transition-colors">
                Track a Product Instead
            </Link>
        </div>
    );

    // ── Authorized form ────────────────────────────────────────────────────
    return (
        <div className="max-w-lg mx-auto space-y-6">
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Add Tracking Update</h1>
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-500 border border-purple-500/20">
                        {roleName}
                    </span>
                </div>
                <p className="text-muted-foreground text-sm">Record a supply chain milestone for a product on-chain.</p>
            </div>

            <div className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-5">
                {/* Product lookup */}
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Product ID</label>
                    <div className="flex gap-2">
                        <input
                            type="number"
                            value={productId}
                            onChange={(e) => { setProductId(e.target.value); setProductInfo(null); setProductError(''); }}
                            placeholder="e.g., 1"
                            disabled={isLoading}
                            className="flex-1 px-3 py-2 text-foreground bg-secondary border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none transition-colors placeholder:text-muted-foreground/50"
                        />
                        <button
                            type="button"
                            onClick={handleLookup}
                            disabled={!productId || productLoading}
                            className="px-4 py-2 bg-secondary border border-border text-foreground text-sm font-medium rounded-lg hover:bg-secondary/80 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                        >
                            <PackageSearch className="h-4 w-4" />
                            {productLoading ? 'Looking up...' : 'Look Up'}
                        </button>
                    </div>

                    {productError && <p className="text-destructive text-xs mt-1.5">{productError}</p>}

                    {productInfo && (
                        <div className="mt-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded-lg text-sm flex items-center justify-between">
                            <span className="font-medium text-foreground">{productInfo.name}</span>
                            <span className="text-muted-foreground text-xs">{String(productInfo.quantity)} {productInfo.unit} available</span>
                        </div>
                    )}
                </div>

                {/* Status */}
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Status</label>
                    <div className="flex flex-wrap gap-2">
                        {STATUS_OPTIONS.map((s) => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => setStatus(s)}
                                disabled={isLoading}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                                    status === s
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-secondary text-muted-foreground border-border hover:text-foreground'
                                }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Location */}
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Current Location</label>
                    <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g., Mumbai Warehouse, Anna Nagar Hub"
                        disabled={isLoading}
                        className="w-full px-3 py-2 text-foreground bg-secondary border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none transition-colors placeholder:text-muted-foreground/50"
                    />
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={isLoading || !productId || !location}
                    className="w-full py-2.5 font-semibold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? 'Submitting...' : 'Record Update'}
                </button>

                {feedback && (
                    <p className={`text-sm text-center p-3 rounded-lg border ${
                        feedback.type === 'success' ? 'bg-green-500/10 text-green-500 border-green-500/20'
                        : feedback.type === 'error' ? 'bg-destructive/10 text-destructive border-destructive/20'
                        : 'bg-secondary/50 text-muted-foreground border-border'
                    }`}>
                        {feedback.msg}
                    </p>
                )}
            </div>

            <div className="text-center">
                <Link href="/track" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    View tracking history &rarr;
                </Link>
            </div>
        </div>
    );
}
