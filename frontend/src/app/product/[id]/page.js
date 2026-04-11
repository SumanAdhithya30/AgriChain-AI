"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { ethers } from 'ethers';
import Link from 'next/link';
import {
    PRODUCT_CONTRACT_ADDRESS,
    PRODUCT_CONTRACT_ABI,
    AGREEMENT_CONTRACT_ADDRESS,
    AGREEMENT_CONTRACT_ABI,
    REGISTRY_CONTRACT_ADDRESS,
    REGISTRY_CONTRACT_ABI
} from '../../../constants';
import { checkAndSwitchNetwork } from '../../../utils/network';

const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';

function ProductImage({ hash, alt }) {
    const [imgError, setImgError] = useState(false);
    const hasValidHash = hash && hash.length > 10 && !imgError;

    if (hasValidHash) {
        return (
            <img
                src={`${IPFS_GATEWAY}${hash}`}
                alt={alt}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
            />
        );
    }
    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-secondary/30">
            <span className="text-7xl mb-3">🌾</span>
            <span className="text-sm text-muted-foreground">No image provided</span>
        </div>
    );
}

export default function ProductDetailPage() {
    const params = useParams();
    const productId = params.id;

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isBuying, setIsBuying] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [quantityToBuy, setQuantityToBuy] = useState('1');
    const [agreementId, setAgreementId] = useState(null);

    const fetchProductDetails = useCallback(async () => {
        if (!productId) return;
        setLoading(true);
        setError('');
        try {
            if (typeof window.ethereum === 'undefined') { setError("MetaMask is not installed."); return; }
            const provider = new ethers.BrowserProvider(window.ethereum);
            const isCorrectNetwork = await checkAndSwitchNetwork(provider);
            if (!isCorrectNetwork) { setError("Please switch to the correct network."); return; }

            const productContract = new ethers.Contract(PRODUCT_CONTRACT_ADDRESS, PRODUCT_CONTRACT_ABI, provider);
            const ownerAddress = await productContract.ownerOf(productId);
            const details = await productContract.productDetails(productId);

            const registryContract = new ethers.Contract(REGISTRY_CONTRACT_ADDRESS, REGISTRY_CONTRACT_ABI, provider);
            const userStruct = await registryContract.users(ownerAddress);
            const isRegistered = userStruct[2];
            const ownerName = isRegistered && userStruct[3][0] ? userStruct[3][0] : ownerAddress;

            setProduct({
                id: productId,
                owner: ownerAddress,
                ownerName,
                name: details.productName,
                ipfsImageHash: details.ipfsImageHash,
                pricePerUnit: details.pricePerUnit,
                quantityAvailable: details.quantityAvailable,
                unit: details.unit,
                dateHarvested: details.dateHarvested,
                isForSale: details.isForSale,
            });
        } catch (err) {
            console.error("Failed to fetch product details:", err);
            setError("Could not find this product or an error occurred.");
        } finally {
            setLoading(false);
        }
    }, [productId]);

    useEffect(() => { fetchProductDetails(); }, [fetchProductDetails]);

    const handleBuyProduct = async () => {
        if (!product) return;
        const quantity = parseInt(quantityToBuy);
        if (isNaN(quantity) || quantity <= 0) { setFeedback("Please enter a valid quantity."); return; }
        if (typeof window.ethereum === 'undefined') { setFeedback("MetaMask is not installed."); return; }

        setIsBuying(true);
        setAgreementId(null);
        setFeedback("Preparing purchase...");
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const isCorrectNetwork = await checkAndSwitchNetwork(provider);
            if (!isCorrectNetwork) { setFeedback("Please switch to the correct network."); setIsBuying(false); return; }

            const signer = await provider.getSigner();
            const agreementContract = new ethers.Contract(AGREEMENT_CONTRACT_ADDRESS, AGREEMENT_CONTRACT_ABI, signer);
            setFeedback("Please confirm transaction in MetaMask...");
            const totalValue = product.pricePerUnit * BigInt(quantity);
            const tx = await agreementContract.createAgreement(product.id, BigInt(quantity), { value: totalValue });
            setFeedback("Transaction sent! Waiting for confirmation...");
            const receipt = await tx.wait();

            const iface = new ethers.Interface(AGREEMENT_CONTRACT_ABI);
            let newAgreementId = null;
            for (const log of receipt.logs) {
                try {
                    const parsed = iface.parseLog(log);
                    if (parsed?.name === 'AgreementCreated') { newAgreementId = parsed.args.agreementId.toString(); break; }
                } catch (_) {}
            }

            setAgreementId(newAgreementId);
            setFeedback(`Purchase successful! ${quantity} ${product.unit}(s) locked in escrow.`);
            fetchProductDetails();
        } catch (err) {
            console.error("Purchase failed:", err);
            if (err.reason) setFeedback(`Error: ${err.reason}`);
            else if (err.code === 'ACTION_REJECTED') setFeedback("Transaction rejected.");
            else setFeedback("An error occurred. Check console.");
        } finally {
            setIsBuying(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-muted-foreground">Loading product...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="flex justify-center p-10">
            <div className="bg-destructive/10 text-destructive p-4 rounded-xl border border-destructive/20 max-w-md text-center">{error}</div>
        </div>
    );

    if (!product) return null;

    const totalCost = product.pricePerUnit * BigInt(parseInt(quantityToBuy) || 0);

    return (
        <div className="space-y-6">
            <Link href="/marketplace" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                &larr; Back to Marketplace
            </Link>

            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2">
                    {/* Image */}
                    <div className="h-80 md:h-full min-h-[320px] overflow-hidden">
                        <ProductImage hash={product.ipfsImageHash} alt={product.name} />
                    </div>

                    {/* Details */}
                    <div className="p-8 flex flex-col">
                        <div className="mb-6">
                            <h1 className="text-3xl font-bold text-foreground mb-1">{product.name}</h1>
                            <p className="text-muted-foreground text-sm">
                                Sold by <span className="text-foreground font-medium">{product.ownerName}</span>
                            </p>
                        </div>

                        <div className="text-2xl font-bold text-primary mb-6">
                            {ethers.formatEther(product.pricePerUnit)} ETH
                            <span className="text-base font-normal text-muted-foreground"> / {product.unit}</span>
                        </div>

                        <div className="bg-secondary/50 rounded-lg p-4 space-y-2 text-sm mb-6">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Token ID</span>
                                <span className="text-foreground font-medium">#{product.id}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Listed On</span>
                                <span className="text-foreground font-medium">{new Date(Number(product.dateHarvested) * 1000).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Available</span>
                                <span className="text-foreground font-medium">{String(product.quantityAvailable)} {product.unit}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Status</span>
                                <span className={`font-medium ${product.isForSale ? 'text-green-500' : 'text-destructive'}`}>
                                    {product.isForSale ? 'For Sale' : 'Sold Out'}
                                </span>
                            </div>
                        </div>

                        <div className="mt-auto space-y-3">
                            <div className="flex items-center gap-3">
                                <label htmlFor="qty" className="text-sm font-medium text-foreground shrink-0">Quantity:</label>
                                <input
                                    id="qty"
                                    type="number"
                                    value={quantityToBuy}
                                    onChange={(e) => setQuantityToBuy(e.target.value)}
                                    className="w-24 px-3 py-2 text-sm text-center text-foreground bg-secondary border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                    min="1"
                                    max={String(product.quantityAvailable || 1)}
                                    disabled={!product.isForSale || isBuying}
                                />
                                <span className="text-muted-foreground text-sm">{product.unit}</span>
                            </div>

                            <button
                                onClick={handleBuyProduct}
                                disabled={!product.isForSale || isBuying || !quantityToBuy || parseInt(quantityToBuy) <= 0}
                                className="w-full px-6 py-3 font-semibold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isBuying
                                    ? "Processing..."
                                    : product.isForSale
                                    ? `Buy Now — ${ethers.formatEther(totalCost)} ETH`
                                    : "Sold Out"}
                            </button>

                            {feedback && (
                                <p className="text-center text-sm text-muted-foreground">{feedback}</p>
                            )}

                            {agreementId && (
                                <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-center">
                                    <p className="text-xs text-muted-foreground mb-1">Agreement #{agreementId} created</p>
                                    <Link href="/agreements" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                                        View in My Agreements &rarr;
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
