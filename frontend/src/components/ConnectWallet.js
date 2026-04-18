"use client";

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useRouter } from 'next/navigation';
import { checkAndSwitchNetwork } from '../utils/network';
import { REGISTRY_CONTRACT_ADDRESS, REGISTRY_CONTRACT_ABI } from '../constants';

const ROLE_LABELS = { 1: 'Farmer', 2: 'Buyer', 3: 'Logistics' };

export default function ConnectWallet() {
  const [account, setAccount] = useState(null);
  const [userProfile, setUserProfile] = useState(null); // { name, role } | null = not registered
  const [checking, setChecking] = useState(false);
  const [contractError, setContractError] = useState(false);
  const router = useRouter();

  const fetchRegistration = async (address, provider) => {
    try {
      setContractError(false);
      const registry = new ethers.Contract(REGISTRY_CONTRACT_ADDRESS, REGISTRY_CONTRACT_ABI, provider);
      const user = await registry.users(address);
      const isRegistered = user[2];
      if (isRegistered) {
        setUserProfile({ name: user[3][0] || address.slice(0, 6), role: Number(user[1]) });
      } else {
        setUserProfile(null);
      }
    } catch {
      setContractError(true);
      setUserProfile(null);
    }
  };

  useEffect(() => {
    const init = async () => {
      if (typeof window.ethereum === 'undefined') return;
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const isCorrect = await checkAndSwitchNetwork(provider);
        if (!isCorrect) return;
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          setAccount(accounts[0].address);
          await fetchRegistration(accounts[0].address, provider);
        }
      } catch (e) {
        console.error(e);
      }
    };
    init();

    const handleAccountsChanged = () => init();
    window.ethereum?.on('accountsChanged', handleAccountsChanged);
    return () => window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
  }, []);

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') { alert("Please install MetaMask."); return; }
    setChecking(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const isCorrect = await checkAndSwitchNetwork(provider);
      if (!isCorrect) return;
      const accounts = await provider.send("eth_requestAccounts", []);
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        await fetchRegistration(accounts[0], provider);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setChecking(false);
    }
  };

  if (!account) {
    return (
      <button
        onClick={connectWallet}
        disabled={checking}
        className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {checking ? 'Connecting...' : 'Connect Wallet'}
      </button>
    );
  }

  if (contractError) {
    return (
      <span className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium rounded-full" title="Run: npm run dev:deploy">
        <span className="w-2 h-2 rounded-full bg-red-500" />
        Contracts not deployed
      </span>
    );
  }

  if (!userProfile) {
    return (
      <button
        onClick={() => router.push('/register')}
        className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 border border-orange-500/30 text-orange-500 text-sm font-medium rounded-full hover:bg-orange-500/20 transition-colors"
      >
        <span className="w-2 h-2 rounded-full bg-orange-500" />
        Not Registered
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-full shadow-sm">
      <span className="w-2 h-2 rounded-full bg-green-500" />
      <span className="text-sm font-medium text-foreground">{userProfile.name}</span>
      <span className="text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full">
        {ROLE_LABELS[userProfile.role] || 'User'}
      </span>
    </div>
  );
}
