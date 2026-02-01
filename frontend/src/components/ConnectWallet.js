// src/components/ConnectWallet.js

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { checkAndSwitchNetwork } from '../utils/network';

export default function ConnectWallet() {
  const [account, setAccount] = useState(null);

  // THIS IS THE REFACTORED CODE
  useEffect(() => {
    // We define an async function inside the effect
    const checkForConnectedWallet = async () => {
      // Check if MetaMask is installed
      if (typeof window.ethereum === 'undefined') {
        console.log("MetaMask is not installed.");
        return;
      }
      
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        
        const isCorrectNetwork = await checkAndSwitchNetwork(provider);
        if (!isCorrectNetwork) return;

        const accounts = await provider.listAccounts();
        
        if (accounts.length > 0) {
          // ESlint is happy because the async function sets the state
          setAccount(accounts[0].address);
        }
      } catch (error) {
        console.error("Error checking for wallet connection:", error);
      }
    };
    
    // Call the async function
    checkForConnectedWallet();
  }, []); // The empty dependency array ensures this runs only once on mount


  // This function is for the button click, it stays the same
  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      alert("Please install MetaMask to use this dApp.");
      return;
    }
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);

      const isCorrectNetwork = await checkAndSwitchNetwork(provider);
      if (!isCorrectNetwork) return;

      const accounts = await provider.send("eth_requestAccounts", []);
      
      if (accounts.length > 0) {
        setAccount(accounts[0]);
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };
  
  // The JSX return statement stays the same
  return (
    <div>
      {account ? (
        <div className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-full shadow-sm">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
          <p className="text-sm font-medium text-foreground font-mono">
            {account.slice(0, 6)}...{account.slice(-4)}
          </p>
        </div>
      ) : (
        <button
          onClick={connectWallet}
          className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-full shadow-sm hover:bg-primary/90 transition-colors"
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
}