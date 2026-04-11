"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ethers } from 'ethers';
import { PRODUCT_CONTRACT_ADDRESS, PRODUCT_CONTRACT_ABI } from '../../constants';
import { checkAndSwitchNetwork } from '../../utils/network';
import { cn } from "@/lib/utils";

const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';

function resolveImageSrc(hash) {
    if (!hash || hash.length < 5) return null;
    if (hash.startsWith('http://') || hash.startsWith('https://')) return hash;
    return `${IPFS_GATEWAY}${hash}`;
}

function ProductImage({ hash, alt, className }) {
    const [imgError, setImgError] = useState(false);
    const src = resolveImageSrc(hash);

    if (src && !imgError) {
        return (
            <img
                src={src}
                alt={alt}
                className={`w-full h-full object-cover ${className || ''}`}
                onError={() => setImgError(true)}
            />
        );
    }
    return (
        <div className={`w-full h-full flex flex-col items-center justify-center bg-secondary/20 ${className || ''}`}>
            <span className="text-5xl mb-2">🌾</span>
            <span className="text-xs text-muted-foreground">No image</span>
        </div>
    );
}

function ProductCard({ product }) {
    const formattedPrice = product?.pricePerUnit ? ethers.formatEther(product.pricePerUnit) : 'N/A';

    return (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-1 h-full flex flex-col group">
            <div className="w-full h-48 relative overflow-hidden">
                <ProductImage hash={product.ipfsImageHash} alt={product.name} />
            </div>
            <div className="p-5 flex flex-col flex-1">
                <h2 className="text-lg font-bold mb-2 text-card-foreground group-hover:text-primary transition-colors">{product.name}</h2>
                <div className="mt-auto">
                    <p className="text-2xl font-bold text-primary mb-1">{formattedPrice} ETH <span className="text-sm font-normal text-muted-foreground">/ {product.unit}</span></p>
                    <div className="flex justify-between items-center text-sm text-muted-foreground mt-2">
                         <span>Available: {String(product.quantityAvailable)}</span>
                         <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">ID: {product.id}</span>
                    </div>
                </div>
            </div>
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
            if (typeof window.ethereum === 'undefined') {
                setError("MetaMask is not installed.");
                return;
            }
            const provider = new ethers.BrowserProvider(window.ethereum);
            
            // Check network before fetching
            const isCorrectNetwork = await checkAndSwitchNetwork(provider);
            if (!isCorrectNetwork) {
                setError("Please switch to the correct network to view products.");
                return;
            }

            const contract = new ethers.Contract(PRODUCT_CONTRACT_ADDRESS, PRODUCT_CONTRACT_ABI, provider);
            
            // --- HYBRID FETCH STRATEGY ---
            let fetchedProducts = [];
            try {
                // 1. Try Optimized Batch Fetch
                const PAGE_SIZE = 100;
                const productsData = await contract.getAllProductsPaginated(1, PAGE_SIZE);
                
                fetchedProducts = productsData.map(p => ({
                    id: Number(p.id),
                    owner: p.owner,
                    name: p.productName,
                    ipfsImageHash: p.ipfsImageHash,
                    pricePerUnit: p.pricePerUnit,
                    quantityAvailable: p.quantityAvailable,
                    unit: p.unit
                }));
            } catch (batchError) {
                console.warn("Batch fetch failed (contract might not be updated). Falling back to legacy fetch.", batchError);
                
                // 2. Fallback: Legacy Iterative Fetch
                const totalProducts = await contract.getTotalProducts();
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
                
                fetchedProducts = await Promise.all(productPromises);
            }
            
            setProducts(fetchedProducts);
            // --- END HYBRID STRATEGY ---

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

    if (loading) return (
        <div className="flex items-center justify-center min-h-[50vh] text-muted-foreground">
            <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p>Loading marketplace...</p>
            </div>
        </div>
    );
    
    if (error) return (
        <div className="flex justify-center p-10">
            <div className="bg-destructive/10 text-destructive p-4 rounded-lg border border-destructive/20 max-w-md text-center">
                {error}
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Marketplace</h1>
                    <p className="text-muted-foreground">Discover and purchase fresh agricultural products directly from farmers.</p>
                </div>
            </div>
            
            {products.length === 0 ? (
                <div className="text-center py-20 bg-card rounded-xl border border-border">
                    <p className="text-muted-foreground">No products have been listed yet.</p>
                    <Link href="/list-product" className="mt-4 inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                        Be the first to list
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {products.map((product) => (
                        <Link href={`/product/${product.id}`} key={product.id} className="block h-full">
                            <ProductCard product={product} /> 
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}