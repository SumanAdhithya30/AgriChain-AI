"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ethers } from 'ethers';
import { PRODUCT_CONTRACT_ADDRESS, PRODUCT_CONTRACT_ABI } from '../../constants';

function ProductCard({ product }) {
    const formattedPrice = product?.pricePerUnit ? ethers.formatEther(product.pricePerUnit) : 'N/A';

    return (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col transition-transform hover:scale-105 h-full">
            <div className="bg-gray-700 w-full h-48 rounded-md mb-4 flex items-center justify-center">
                <p className="text-gray-500 text-xs break-all px-2">{product.ipfsImageHash || "Image"}</p>
            </div>
            <h2 className="text-2xl font-bold mb-2 text-white">{product.name}</h2>
            <p className="text-xl font-semibold text-green-400 mb-2">{formattedPrice} ETH / {product.unit}</p>
            <p className="text-sm text-gray-400">Available: {String(product.quantityAvailable)} {product.unit}</p>
            <p className="text-gray-400 text-xs">Token ID: {product.id}</p>
        </div>
    );
}

export default function MarketplacePage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const contract = new ethers.Contract(PRODUCT_CONTRACT_ADDRESS, PRODUCT_CONTRACT_ABI, provider);
            
            // --- THIS IS THE CORRECTED LOGIC ---
            // 1. Get the total number of products using our new custom function
            const totalProducts = await contract.getTotalProducts();
            
            // 2. Get the array of all product IDs
            // Note: For a real app, we'd paginate this, but for now, we'll fetch all.
            const productIds = await contract.getProductIds(1, totalProducts);
            
            const productPromises = productIds.map(tokenId => 
                (async () => {
                    const owner = await contract.ownerOf(tokenId);
                    const details = await contract.productDetails(tokenId);
                    
                    return {
                        id: Number(tokenId),
                        owner: owner,
                        name: details.productName,
                        ipfsImageHash: details.ipfsImageHash,
                        pricePerUnit: details.pricePerUnit,
                        quantityAvailable: details.quantityAvailable,
                        unit: details.unit
                    };
                })()
            );
            
            const fetchedProducts = await Promise.all(productPromises);
            setProducts(fetchedProducts);
            // --- END OF CORRECTION ---

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

    if (loading) return <div className="text-center text-white p-10">Loading products...</div>;
    if (error) return <div className="text-center text-red-400 p-10">{error}</div>;

    return (
        <main className="min-h-screen p-8 bg-gray-900 text-white">
            <h1 className="text-4xl font-bold text-center mb-12">Marketplace</h1>
            
            {products.length === 0 ? (
                <p className="text-center text-gray-400">No products have been listed yet.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {products.map((product) => (
                        <Link href={`/product/${product.id}`} key={product.id}>
                            <ProductCard product={product} /> 
                        </Link>
                    ))}
                </div>
            )}
        </main>
    );
}