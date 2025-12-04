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
        <div className="p-4 bg-green-800 border border-green-500 rounded-lg text-white">
          <p className="font-bold">Wallet Connected:</p>
          <p className="font-mono text-sm break-all">{account}</p>
        </div>
      ) : (
        <button
          onClick={connectWallet}
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors"
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
}