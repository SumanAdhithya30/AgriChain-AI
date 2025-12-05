"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { ethers } from 'ethers';
import { 
    PRODUCT_CONTRACT_ADDRESS, 
    PRODUCT_CONTRACT_ABI,
    AGREEMENT_CONTRACT_ADDRESS,
    AGREEMENT_CONTRACT_ABI,
    REGISTRY_CONTRACT_ADDRESS,
    REGISTRY_CONTRACT_ABI
} from '../../../constants';
import Link from 'next/link';
import { checkAndSwitchNetwork } from '../../../utils/network';

export default function ProductDetailPage() {
    const params = useParams();
    const productId = params.id;

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [isBuying, setIsBuying] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [quantityToBuy, setQuantityToBuy] = useState('1'); 

    const fetchProductDetails = useCallback(async () => {
        if (!productId) return;
        setLoading(true);
        setError('');
        try {
            if (typeof window.ethereum === 'undefined') {
                setError("MetaMask is not installed.");
                return;
            }
            const provider = new ethers.BrowserProvider(window.ethereum);
            
            // Check network
            const isCorrectNetwork = await checkAndSwitchNetwork(provider);
            if (!isCorrectNetwork) {
                setError("Please switch to the correct network.");
                return;
            }

            const productContract = new ethers.Contract(PRODUCT_CONTRACT_ADDRESS, PRODUCT_CONTRACT_ABI, provider);
            const ownerAddress = await productContract.ownerOf(productId);
            const details = await productContract.productDetails(productId);
            
            const registryContract = new ethers.Contract(REGISTRY_CONTRACT_ADDRESS, REGISTRY_CONTRACT_ABI, provider);
            const userStruct = await registryContract.users(ownerAddress);
            const isRegistered = userStruct[2];
            const ownerProfile = userStruct[3];
            const name = ownerProfile[0];

            const ownerName = name && isRegistered ? name : ownerAddress;

            setProduct({
                id: productId,
                owner: ownerAddress,
                ownerName: ownerName,
                name: details.productName,
                pricePerUnit: details.pricePerUnit,
                quantityAvailable: details.quantityAvailable,
                unit: details.unit,
                dateHarvested: details.dateHarvested, // <-- ADDED THIS
                isForSale: details.isForSale,
            });

        } catch (err) {
            console.error("Failed to fetch product details:", err);
            setError("Could not find this product or an error occurred.");
        } finally {
            setLoading(false);
        }
    }, [productId]);

    useEffect(() => {
        fetchProductDetails();
    }, [fetchProductDetails]);


    const handleBuyProduct = async () => {
        // ... This function remains exactly the same
        if (!product) return;
        const quantity = parseInt(quantityToBuy);
        if (isNaN(quantity) || quantity <= 0) {
            setFeedback("Please enter a valid quantity.");
            return;
        }
        if (typeof window.ethereum === 'undefined') {
            setFeedback("MetaMask is not installed.");
            return;
        }

        setIsBuying(true);
        setFeedback("Preparing purchase...");
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            
            const isCorrectNetwork = await checkAndSwitchNetwork(provider);
            if (!isCorrectNetwork) {
                setFeedback("Please switch to the correct network.");
                setIsBuying(false);
                return;
            }

            const signer = await provider.getSigner();
            const agreementContract = new ethers.Contract(AGREEMENT_CONTRACT_ADDRESS, AGREEMENT_CONTRACT_ABI, signer);
            setFeedback("Please confirm transaction in MetaMask...");
            const totalValue = product.pricePerUnit * BigInt(quantity);
            const tx = await agreementContract.createAgreement(product.id, BigInt(quantity), { value: totalValue });
            setFeedback("Transaction sent! Waiting for confirmation...");
            await tx.wait();
            setFeedback(`Success! ${quantity} ${product.unit}(s) purchased. Funds are in escrow.`);
            fetchProductDetails(); 
        } catch(err) {
            console.error("Purchase failed:", err);
            if (err.reason) { setFeedback(`Error: ${err.reason}`); }
            else if (err.code === 'ACTION_REJECTED') { setFeedback("Transaction rejected."); }
            else { setFeedback("An error occurred. Check console."); }
        } finally {
            setIsBuying(false);
        }
    };


    if (loading) return <p className="text-center text-white p-10">Loading product...</p>;
    if (error) return <p className="text-center text-red-400 p-10">{error}</p>;
    if (!product) return <p className="text-center text-white p-10">Product not found.</p>;

    return (
        <main className="min-h-screen p-8 bg-gray-900 text-white">
            <div className="container mx-auto max-w-4xl">
                <Link href="/marketplace" className="text-blue-400 hover:underline mb-8 block">&larr; Back to Marketplace</Link>
                
                <div className="bg-gray-800 rounded-lg shadow-lg p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-gray-700 w-full h-96 rounded-md flex items-center justify-center">
                        <p className="text-gray-500">Product Image Placeholder</p>
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
                        <p className="text-lg text-gray-300 mb-4">Sold by: <span className="font-semibold">{product.ownerName}</span></p>
                        
                        <p className="text-xl font-semibold text-green-400 mb-4">
                            {ethers.formatEther(product.pricePerUnit)} ETH / {product.unit}
                        </p>
                        
                        <div className="text-sm text-gray-400 space-y-2 mb-6">
                           <p><span className="font-bold">Token ID:</span> {product.id}</p> 
                           <p><span className="font-bold">Owner's Address:</span> <span className="break-all">{product.owner}</span></p> 
                           {/* --- THIS IS THE NEW LINE --- */}
                           <p><span className="font-bold">Listed On:</span> {new Date(Number(product.dateHarvested) * 1000).toLocaleDateString()}</p> 
                           {/* ----------------------------- */}
                           <p><span className="font-bold">Status:</span> {product.isForSale ? "For Sale" : "Sold Out"}</p> 
                           <p><span className="font-bold">Available:</span> {String(product.quantityAvailable)} {product.unit}</p> 
                        </div>

                        <div className="mt-auto">
                            <div className="flex items-center mb-4 gap-4">
                                <label htmlFor="quantityToBuy" className="text-sm font-medium shrink-0">Buy Quantity:</label>
                                <input id="quantityToBuy" type="number" value={quantityToBuy} onChange={(e) => setQuantityToBuy(e.target.value)} className="w-24 px-2 py-1 text-sm text-center text-white bg-gray-700 border border-gray-600 rounded-md" min="1" max={product.quantityAvailable > 0 ? String(product.quantityAvailable) : 1} disabled={!product.isForSale || isBuying} />
                                <span className="text-gray-500">{product.unit}</span>
                            </div>

                            <button onClick={handleBuyProduct} disabled={!product.isForSale || isBuying || !quantityToBuy || parseInt(quantityToBuy) <= 0} className="w-full px-6 py-3 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed">
                                {isBuying ? "Processing..." : (product.isForSale ? `Buy Now (${ethers.formatEther(product.pricePerUnit * BigInt(quantityToBuy || 0))} ETH)` : "This item has been sold")}
                            </button>
                            {feedback && <p className="text-center text-sm text-gray-300 mt-4">{feedback}</p>}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}