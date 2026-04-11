"use client";

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Link from 'next/link';
import { CheckCircle2, User, MapPin, Phone, BadgeCheck } from 'lucide-react';
import { REGISTRY_CONTRACT_ADDRESS, REGISTRY_CONTRACT_ABI } from '../../constants';
import { checkAndSwitchNetwork } from '../../utils/network';

const ROLE_LABELS = { 1: 'Farmer', 2: 'Buyer', 3: 'Logistics Provider' };
const ROLE_COLORS = {
    1: 'bg-green-500/10 text-green-500 border border-green-500/20',
    2: 'bg-blue-500/10 text-blue-500 border border-blue-500/20',
    3: 'bg-purple-500/10 text-purple-500 border border-purple-500/20',
};

export default function RegisterPage() {
    const [status, setStatus] = useState('checking'); // checking | unregistered | registered
    const [existingProfile, setExistingProfile] = useState(null);

    const [profile, setProfile] = useState({ name: '', location: '', contactInfo: '', licenseOrId: '' });
    const [selectedRole, setSelectedRole] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [feedback, setFeedback] = useState('');

    // On mount — check if already registered
    useEffect(() => {
        const check = async () => {
            if (typeof window.ethereum === 'undefined') { setStatus('unregistered'); return; }
            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const isCorrect = await checkAndSwitchNetwork(provider);
                if (!isCorrect) { setStatus('unregistered'); return; }

                const accounts = await provider.listAccounts();
                if (accounts.length === 0) { setStatus('unregistered'); return; }

                const registry = new ethers.Contract(REGISTRY_CONTRACT_ADDRESS, REGISTRY_CONTRACT_ABI, provider);
                const user = await registry.users(accounts[0].address);
                const isRegistered = user[2];

                if (isRegistered) {
                    setExistingProfile({
                        name: user[3][0],
                        location: user[3][1],
                        contactInfo: user[3][2],
                        licenseOrId: user[3][3],
                        role: Number(user[1]),
                        address: accounts[0].address,
                    });
                    setStatus('registered');
                } else {
                    setStatus('unregistered');
                }
            } catch {
                setStatus('unregistered');
            }
        };
        check();
    }, []);

    const handleRegister = async () => {
        if (!profile.name || !profile.location) { setFeedback('Please fill in at least Name and Location.'); return; }
        if (typeof window.ethereum === 'undefined') { setFeedback('MetaMask is not installed.'); return; }

        setIsLoading(true);
        setFeedback('Preparing transaction... Please confirm in MetaMask.');
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const isCorrect = await checkAndSwitchNetwork(provider);
            if (!isCorrect) { setFeedback('Please switch to the correct network.'); return; }

            const signer = await provider.getSigner();
            const registry = new ethers.Contract(REGISTRY_CONTRACT_ADDRESS, REGISTRY_CONTRACT_ABI, signer);
            const tx = await registry.registerUser(selectedRole, profile);
            setFeedback('Transaction sent! Waiting for confirmation...');
            await tx.wait();

            // Update UI to registered state
            setExistingProfile({ ...profile, role: selectedRole, address: await signer.getAddress() });
            setStatus('registered');
            setFeedback('');
        } catch (error) {
            const reason = error.reason || '';
            if (reason.includes('already registered')) setFeedback('This wallet is already registered.');
            else if (error.code === 'ACTION_REJECTED') setFeedback('Transaction rejected.');
            else setFeedback(`Error: ${reason || 'Something went wrong.'}`);
        } finally {
            setIsLoading(false);
        }
    };

    // ── Checking state ─────────────────────────────────────────────────────
    if (status === 'checking') {
        return (
            <div className="flex items-center justify-center min-h-[40vh]">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-muted-foreground text-sm">Checking registration status...</p>
                </div>
            </div>
        );
    }

    // ── Already registered ─────────────────────────────────────────────────
    if (status === 'registered' && existingProfile) {
        return (
            <div className="max-w-2xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Your Profile</h1>
                    <p className="text-muted-foreground mt-1">Your identity is registered on the AgriChain blockchain.</p>
                </div>

                <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center gap-4 p-6 border-b border-border bg-primary/5">
                        <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-7 w-7 text-primary" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-bold text-foreground">{existingProfile.name}</h2>
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                            </div>
                            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full mt-1 inline-block ${ROLE_COLORS[existingProfile.role]}`}>
                                {ROLE_LABELS[existingProfile.role]}
                            </span>
                        </div>
                    </div>

                    {/* Details */}
                    <div className="p-6 space-y-4">
                        {[
                            { icon: MapPin, label: 'Location', value: existingProfile.location },
                            { icon: Phone, label: 'Contact', value: existingProfile.contactInfo || '—' },
                            { icon: BadgeCheck, label: 'Certification / ID', value: existingProfile.licenseOrId || '—' },
                        ].map(({ icon: Icon, label, value }) => (
                            <div key={label} className="flex items-start gap-3">
                                <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs text-muted-foreground">{label}</p>
                                    <p className="text-sm text-foreground font-medium">{value}</p>
                                </div>
                            </div>
                        ))}

                        <div className="pt-2 border-t border-border">
                            <p className="text-xs text-muted-foreground">Wallet Address</p>
                            <p className="text-xs font-mono text-foreground break-all mt-0.5">{existingProfile.address}</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="px-6 pb-6 flex gap-3">
                        <Link
                            href="/"
                            className="flex-1 text-center px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            Go to Dashboard
                        </Link>
                        <Link
                            href="/marketplace"
                            className="flex-1 text-center px-4 py-2 bg-secondary text-foreground text-sm font-medium rounded-lg hover:bg-secondary/80 border border-border transition-colors"
                        >
                            Browse Marketplace
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // ── Registration form ──────────────────────────────────────────────────
    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Register Profile</h1>
                <p className="text-muted-foreground mt-1">Create your identity on the AgriChain platform to get started.</p>
            </div>

            <div className="bg-card border border-border rounded-xl shadow-sm p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-foreground mb-1">Select your role</label>
                        <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(Number(e.target.value))}
                            className="w-full px-3 py-2 text-foreground bg-secondary border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none transition-colors"
                            disabled={isLoading}
                        >
                            <option value={1}>Farmer</option>
                            <option value={2}>Buyer</option>
                            <option value={3}>Logistics Provider</option>
                        </select>
                    </div>

                    {[
                        { name: 'name', label: 'Name / Company Name', placeholder: 'e.g., Green Valley Farms', required: true },
                        { name: 'location', label: 'Location', placeholder: 'e.g., Nashik, Maharashtra', required: true },
                        { name: 'contactInfo', label: 'Contact Info (Website / Email)', placeholder: 'e.g., www.greenvalley.com', required: false },
                        { name: 'licenseOrId', label: 'Certification / Business ID', placeholder: 'e.g., FSSAI #12345', required: false },
                    ].map((field) => (
                        <div key={field.name}>
                            <label className="block text-sm font-medium text-foreground mb-1">
                                {field.label}
                                {field.required && <span className="text-destructive ml-1">*</span>}
                            </label>
                            <input
                                name={field.name}
                                type="text"
                                value={profile[field.name]}
                                onChange={(e) => setProfile({ ...profile, [e.target.name]: e.target.value })}
                                placeholder={field.placeholder}
                                disabled={isLoading}
                                className="w-full px-3 py-2 text-foreground bg-secondary border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none transition-colors placeholder:text-muted-foreground/50"
                            />
                        </div>
                    ))}
                </div>

                <button
                    onClick={handleRegister}
                    disabled={isLoading}
                    className="w-full py-3 font-semibold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                    {isLoading ? 'Registering...' : 'Register Profile'}
                </button>

                {feedback && (
                    <p className={`text-center text-sm p-3 rounded-lg border ${
                        feedback.startsWith('Error') || feedback.includes('rejected')
                            ? 'bg-destructive/10 text-destructive border-destructive/20'
                            : 'bg-secondary/50 text-muted-foreground border-border'
                    }`}>
                        {feedback}
                    </p>
                )}
            </div>
        </div>
    );
}
