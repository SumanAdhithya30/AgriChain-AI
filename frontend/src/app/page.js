// src/app/page.js

"use client";
import ConnectWallet from '../components/ConnectWallet';

export default function Home() {
  return (
    // ADDED bg-gray-900 and text-white here
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-900 text-white">
      <h1 className="text-4xl font-bold mb-8">Welcome to AgriChain</h1>
      <div>
        <ConnectWallet />
      </div>
    </main>
  );
}