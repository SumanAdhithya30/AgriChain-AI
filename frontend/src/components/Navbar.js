"use client";

import Link from 'next/link';
import ConnectWallet from './ConnectWallet';

export default function Navbar() {
    return (
        <nav className="bg-gray-800 p-4 shadow-lg">
            <div className="container mx-auto flex justify-between items-center">
                <Link href="/" className="text-white text-2xl font-bold">
                    AgriChain
                </Link>
                <div className="flex items-center space-x-6">
                    <Link href="/register" className="text-gray-300 hover:text-white transition-colors">
                        Register
                    </Link>
                    <Link href="/list-product" className="text-gray-300 hover:text-white transition-colors">
                        List a Product
                    </Link>
                    
                    {/* THIS IS THE NEW LINE YOU ARE ADDING */}
                    <Link href="/marketplace" className="text-gray-300 hover:text-white transition-colors">
                        Marketplace
                    </Link>

                </div>
                <ConnectWallet />
            </div>
        </nav>
    );
}