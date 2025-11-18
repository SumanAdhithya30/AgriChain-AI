"use client";

import Link from 'next/link';
import ConnectWallet from './ConnectWallet';

export default function Navbar() {
    return (
        <nav className="bg-gray-800 p-4 shadow-lg sticky top-0 z-50">
            <div className="container mx-auto flex justify-between items-center">
                {/* Left Side: Brand */}
                <Link href="/" className="text-white text-2xl font-bold">
                    AgriChain
                </Link>

                {/* Center: Main Navigation Links */}
                <div className="hidden md:flex items-center space-x-6">
                    <Link href="/marketplace" className="text-gray-300 hover:text-white transition-colors">
                        Marketplace
                    </Link>
                    <Link href="/list-product" className="text-gray-300 hover:text-white transition-colors">
                        List Product
                    </Link>
                    
                    {/* NEW: Links for Traceability */}
                    <Link href="/track" className="text-gray-300 hover:text-white transition-colors">
                        Track Product
                    </Link>
                    <Link href="/add-update" className="text-gray-300 hover:text-white transition-colors">
                        Add Update (Admin)
                    </Link>

                    {/* We can add a dashboard link here later */}
                    <Link href="/register" className="text-gray-300 hover:text-white transition-colors">
                        Register
                    </Link>
                </div>

                {/* Right Side: Wallet Connector */}
                <div className="flex items-center">
                    <ConnectWallet />
                </div>
            </div>
        </nav>
    );
}