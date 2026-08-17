import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Star, UploadCloud, X, CheckCircle2 } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

export function ReviewModal({ 
    isOpen, 
    onClose, 
    product, 
    onSuccess 
}: { 
    isOpen: boolean, 
    onClose: () => void, 
    product: any, 
    onSuccess?: () => void 
}) {
    const { token } = useAuth();
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [reviewText, setReviewText] = useState("");
    const [mediaUrl, setMediaUrl] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating < 1 || rating > 5) {
            toast.error("Please select a star rating");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/reviews", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    product_id: product.id || product.listing_id,
                    rating,
                    review_text: reviewText,
                    media_url: mediaUrl
                })
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("Review submitted successfully");
                if (onSuccess) onSuccess();
                onClose();
            } else {
                toast.error(data.error || "Failed to submit review");
            }
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-[#0b0f19] border border-gray-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative"
            >
                <div className="p-6 border-b border-gray-800 bg-white/[0.02] flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold font-display text-white">Rate This Product</h2>
                        <p className="text-sm text-gray-400">Share your experience with others.</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-white/[0.02]">
                        <img src={product.image_url} className="w-16 h-16 rounded-lg object-cover" alt={product.title} />
                        <div>
                            <h4 className="font-bold text-white line-clamp-1">{product.title}</h4>
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium mt-1">
                                <CheckCircle2 className="w-3 h-3" /> Verified Purchase
                            </span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2">Your Rating</label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    className={`w-10 h-10 cursor-pointer transition-colors ${
                                        (hoverRating || rating) >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600 hover:text-gray-500'
                                    }`}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={() => setRating(star)}
                                />
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2">Written Review <span className="text-gray-500 font-normal">(Optional)</span></label>
                        <textarea 
                            className="w-full bg-[#111422] border border-gray-800 rounded-xl px-4 py-3 text-white min-h-[120px]"
                            placeholder="What did you like or dislike?"
                            value={reviewText}
                            onChange={e => setReviewText(e.target.value)}
                            maxLength={1000}
                        />
                        <div className="text-right text-xs text-gray-500 mt-1">{reviewText.length}/1000</div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2">Attach Media <span className="text-gray-500 font-normal">(Optional)</span></label>
                        <div className="flex items-center gap-4">
                            <input 
                                type="url" 
                                className="flex-1 bg-[#111422] border border-gray-800 rounded-xl px-4 py-3 text-white text-sm"
                                placeholder="https://example.com/screenshot.jpg"
                                value={mediaUrl}
                                onChange={e => setMediaUrl(e.target.value)}
                            />
                        </div>
                    </div>

                    <Button type="submit" disabled={loading || rating === 0} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-6 text-lg">
                        {loading ? "Submitting..." : "Submit Review"}
                    </Button>
                </form>
            </motion.div>
        </div>
    );
}
