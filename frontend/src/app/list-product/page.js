"use client";

import { useState, useRef } from 'react';
import { ethers } from 'ethers';
import { ImagePlus, X, Upload, Loader2 } from 'lucide-react';
import { PRODUCT_CONTRACT_ADDRESS, PRODUCT_CONTRACT_ABI } from '../../constants';
import { checkAndSwitchNetwork } from '../../utils/network';

async function uploadToPinata(file) {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Upload failed');
    }
    const data = await res.json();
    return data.cid;
}

export default function ListProductPage() {
    const [formData, setFormData] = useState({
        productName: '',
        pricePerUnit: '',
        quantity: '',
        unit: 'kg',
    });

    // Image state
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [ipfsHash, setIpfsHash] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState(null); // null | 'success' | 'error'
    const fileInputRef = useRef(null);

    const [isLoading, setIsLoading] = useState(false);
    const [feedback, setFeedback] = useState(null); // { type, msg }

    const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    // ── Image selection ────────────────────────────────────────────────────
    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
        setIpfsHash('');
        setUploadStatus(null);
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
        setIpfsHash('');
        setUploadStatus(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // ── Upload to Pinata ───────────────────────────────────────────────────
    const handleUpload = async () => {
        if (!imageFile) return;
        setUploading(true);
        setUploadStatus(null);
        try {
            const hash = await uploadToPinata(imageFile);
            setIpfsHash(hash);
            setUploadStatus('success');
        } catch (err) {
            console.error('Pinata upload failed:', err);
            setUploadStatus('error');
        } finally {
            setUploading(false);
        }
    };

    // ── List product ───────────────────────────────────────────────────────
    const handleListProduct = async (e) => {
        e.preventDefault();
        const { productName, pricePerUnit, quantity, unit } = formData;
        if (!productName || !pricePerUnit || !quantity) {
            setFeedback({ type: 'error', msg: 'Please fill in all required fields.' });
            return;
        }
        if (imageFile && !ipfsHash) {
            setFeedback({ type: 'error', msg: 'Please upload the image to IPFS before listing.' });
            return;
        }
        if (typeof window.ethereum === 'undefined') {
            setFeedback({ type: 'error', msg: 'MetaMask is not installed.' });
            return;
        }

        setIsLoading(true);
        setFeedback({ type: 'info', msg: 'Preparing transaction... Please confirm in MetaMask.' });
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const isCorrect = await checkAndSwitchNetwork(provider);
            if (!isCorrect) { setFeedback({ type: 'error', msg: 'Wrong network.' }); return; }

            const signer = await provider.getSigner();
            const productContract = new ethers.Contract(PRODUCT_CONTRACT_ADDRESS, PRODUCT_CONTRACT_ABI, signer);
            const priceInWei = ethers.parseEther(pricePerUnit);

            const tx = await productContract.listNewProduct(productName, ipfsHash, priceInWei, quantity, unit);
            setFeedback({ type: 'info', msg: 'Transaction sent! Waiting for confirmation...' });
            await tx.wait();

            setFeedback({ type: 'success', msg: `"${productName}" listed successfully!` });
            setFormData({ productName: '', pricePerUnit: '', quantity: '', unit: 'kg' });
            handleRemoveImage();
        } catch (error) {
            if (error.reason) setFeedback({ type: 'error', msg: error.reason });
            else if (error.code === 'ACTION_REJECTED') setFeedback({ type: 'error', msg: 'Transaction rejected.' });
            else setFeedback({ type: 'error', msg: 'Listing failed. Are you registered as a Farmer?' });
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const inputClass = "w-full px-3 py-2 text-foreground bg-secondary border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none transition-colors placeholder:text-muted-foreground/50";

    return (
        <div className="max-w-lg mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">List a New Product</h1>
                <p className="text-muted-foreground mt-1">You must be a registered Farmer to list products.</p>
            </div>

            <form onSubmit={handleListProduct} className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-5">

                {/* ── Image upload ── */}
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Product Image</label>

                    {!imagePreview ? (
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-40 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors bg-secondary/30"
                        >
                            <ImagePlus className="h-8 w-8" />
                            <span className="text-sm font-medium">Click to select an image</span>
                            <span className="text-xs">JPG, PNG, WEBP up to 10MB</span>
                        </button>
                    ) : (
                        <div className="space-y-3">
                            {/* Preview */}
                            <div className="relative w-full h-48 rounded-xl overflow-hidden border border-border">
                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={handleRemoveImage}
                                    className="absolute top-2 right-2 p-1 bg-background/80 rounded-full hover:bg-background transition-colors"
                                >
                                    <X className="h-4 w-4 text-foreground" />
                                </button>
                            </div>

                            {/* Upload to IPFS button */}
                            {!ipfsHash && uploadStatus !== 'success' && (
                                <button
                                    type="button"
                                    onClick={handleUpload}
                                    disabled={uploading}
                                    className="w-full py-2 flex items-center justify-center gap-2 text-sm font-medium bg-secondary border border-border rounded-lg hover:bg-secondary/80 disabled:opacity-50 transition-colors text-foreground"
                                >
                                    {uploading
                                        ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading to IPFS...</>
                                        : <><Upload className="h-4 w-4" /> Upload to IPFS (Pinata)</>
                                    }
                                </button>
                            )}

                            {/* Status messages */}
                            {uploadStatus === 'success' && (
                                <div className="px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                                    <p className="text-xs text-green-500 font-medium">Uploaded to IPFS</p>
                                    <p className="text-xs text-muted-foreground font-mono break-all mt-0.5">{ipfsHash}</p>
                                </div>
                            )}
                            {uploadStatus === 'error' && (
                                <p className="text-xs text-destructive px-1">Upload failed. Check your Pinata JWT in .env.local and try again.</p>
                            )}
                        </div>
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                    />
                </div>

                {/* ── Product Name ── */}
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                        Product Name <span className="text-destructive">*</span>
                    </label>
                    <input
                        name="productName"
                        type="text"
                        value={formData.productName}
                        onChange={handleInputChange}
                        placeholder="e.g., Organic Tomatoes"
                        disabled={isLoading}
                        className={inputClass}
                    />
                </div>

                {/* ── Price / Quantity / Unit ── */}
                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            Price (ETH) <span className="text-destructive">*</span>
                        </label>
                        <input
                            name="pricePerUnit"
                            type="text"
                            value={formData.pricePerUnit}
                            onChange={handleInputChange}
                            placeholder="0.01"
                            disabled={isLoading}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            Quantity <span className="text-destructive">*</span>
                        </label>
                        <input
                            name="quantity"
                            type="number"
                            value={formData.quantity}
                            onChange={handleInputChange}
                            placeholder="100"
                            disabled={isLoading}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Unit</label>
                        <select
                            name="unit"
                            value={formData.unit}
                            onChange={handleInputChange}
                            disabled={isLoading}
                            className={inputClass}
                        >
                            <option value="kg">kg</option>
                            <option value="ton">ton</option>
                            <option value="piece">piece</option>
                            <option value="liter">liter</option>
                        </select>
                    </div>
                </div>

                {/* ── Submit ── */}
                <button
                    type="submit"
                    disabled={isLoading || (imageFile && !ipfsHash)}
                    className="w-full py-3 font-semibold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? 'Listing Product...' : 'List Product on Blockchain'}
                </button>

                {imageFile && !ipfsHash && !uploading && uploadStatus !== 'error' && (
                    <p className="text-xs text-center text-muted-foreground">Upload the image to IPFS before listing.</p>
                )}

                {feedback && (
                    <p className={`text-sm text-center p-3 rounded-lg border ${
                        feedback.type === 'success' ? 'bg-green-500/10 text-green-500 border-green-500/20'
                        : feedback.type === 'error' ? 'bg-destructive/10 text-destructive border-destructive/20'
                        : 'bg-secondary/50 text-muted-foreground border-border'
                    }`}>
                        {feedback.msg}
                    </p>
                )}
            </form>
        </div>
    );
}
