"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link'; // Import the Link component
import { ethers } from 'ethers';
import { PRODUCT_CONTRACT_ADDRESS, PRODUCT_CONTRACT_ABI } from '../../constants';

// ProductCard is now a simpler, "dumb" component for display only
function ProductCard({ product }) {
    return (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col transition-transform hover:scale-105 h-full">
            <div className="bg-gray-700 w-full h-48 rounded-md mb-4 flex items-center justify-center">
                <p className="text-gray-500 text-xs break-all px-2">{product.ipfsHash || "Image"}</p>
            </div>
            <h2 className="text-2xl font-bold mb-2 text-white">{product.name}</h2>
            
            {/* NEW: Display the formatted price */}
            <p className="text-xl font-semibold text-green-400 mb-2">
                {ethers.formatEther(product.price)} ETH
            </p>

            <p className="text-gray-400 mb-2">Token ID: {product.id}</p>
            <p className="text-xs text-gray-500 wrap-break-word">Owner: {product.owner}</p>
        </div>
    );
}


export default function MarketplacePage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchProducts = useCallback(async () => {
        if (!PRODUCT_CONTRACT_ADDRESS) {
             setError("Contract address is not defined. Check your .env.local file.");
             setLoading(false);
             return;
        }
        if (typeof window.ethereum === 'undefined') {
            setError("MetaMask is not installed.");
            setLoading(false);
            return;
        }
        
        setLoading(true);
        setError('');
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const contract = new ethers.Contract(
                PRODUCT_CONTRACT_ADDRESS,
                PRODUCT_CONTRACT_ABI,
                provider
            );
            
            const totalSupplyBigInt = await contract.totalSupply();
            const totalSupply = Number(totalSupplyBigInt);
            
            const productPromises = [];
            for (let i = 0; i < totalSupply; i++) {
                const promise = (async () => {
                    const tokenId = await contract.tokenByIndex(i);
                    const owner = await contract.ownerOf(tokenId);
                    const details = await contract.productDetails(tokenId);
                    
                    return {
                        id: Number(tokenId),
                        owner: owner,
                        name: details.productName,
                        ipfsHash: details.ipfsImageHash,
                        price: details.price // We can grab the price here too
                    };
                })();
                productPromises.push(promise);
            }
            
            const fetchedProducts = await Promise.all(productPromises);
            setProducts(fetchedProducts);

        } catch (error) {
            console.error("Could not fetch products:", error);
            setError("Failed to fetch products from the blockchain.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    if (loading) {
        return <div className="text-center text-white p-10">Loading products from the blockchain...</div>;
    }
    
    if (error) {
        return <div className="text-center text-red-400 p-10">{error}</div>;
    }

    return (
        <main className="min-h-screen p-8 bg-gray-900 text-white">
            <h1 className="text-4xl font-bold text-center mb-12">Marketplace</h1>
            
            {products.length === 0 ? (
                <p className="text-center text-gray-400">No products have been listed yet.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {products.map((product) => (
                        // This makes the entire card a clickable link to the product's detail page
                        <Link href={`/product/${product.id}`} key={product.id}>
                            <ProductCard product={product} /> 
                        </Link>
                    ))}
                </div>
            )}
        </main>
    );
}