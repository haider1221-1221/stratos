import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../lib/api';
import { toast } from 'sonner';
import {
    ShoppingBag, Heart, Zap, Shield,
    Sparkles, ChevronRight, ArrowLeft,
    Gem, CreditCard, Lock, CheckCircle2, Package, X
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Shop = () => {
    const { user, refreshUser } = useAuth();
    const [items, setItems] = useState([]);
    const [gemPackages, setGemPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [buying, setBuying] = useState(null);
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [showCheckout, setShowCheckout] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        const fetchShopData = async () => {
            try {
                const [shopRes, gemsRes] = await Promise.all([
                    axios.get(`${API_URL}/shop`),
                    axios.get(`${API_URL}/shop/gems`)
                ]);
                setItems(shopRes.data);
                setGemPackages(gemsRes.data);
            } catch (error) {
                console.error('Failed to fetch shop data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchShopData();
    }, []);

    const handleBuyItem = async (itemId) => {
        setBuying(itemId);
        try {
            const response = await axios.post(`${API_URL}/shop/buy/${itemId}`);
            toast.success(response.data.message);
            refreshUser();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to purchase item');
        } finally {
            setBuying(null);
        }
    };

    const handleGemPurchase = async () => {
        if (!selectedPackage) return;
        setIsProcessing(true);
        try {
            // Mock payment delay
            await new Promise(resolve => setTimeout(resolve, 2000));
            const response = await axios.post(`${API_URL}/shop/gems/checkout/${selectedPackage.id}`);
            toast.success(response.data.message);
            refreshUser();
            setShowCheckout(false);
            setSelectedPackage(null);
        } catch (error) {
            toast.error('Payment failed. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const itemIcons = {
        'streak-freeze': <Shield className="w-10 h-10 text-sky-400" />,
        'heart-refill': <Heart className="w-10 h-10 text-red-500 fill-red-500" />,
        'xp-double': <Zap className="w-10 h-10 text-yellow-500 fill-yellow-500 animate-pulse" />,
    };

    const gemIcons = {
        'fist': <Gem className="w-8 h-8 text-sky-400" />,
        'pouch': <ShoppingBag className="w-10 h-10 text-indigo-400" />,
        'chest': <Package className="w-12 h-12 text-amber-500" />
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/dashboard" className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </Link>
                        <h1 className="font-heading font-bold text-xl text-slate-800">Stratos Shop</h1>
                    </div>

                    <div className="bg-indigo-50 px-4 py-2 rounded-2xl flex items-center gap-2 border border-indigo-100">
                        <div className="w-6 h-6 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-200 animate-bounce-subtle">
                            <Sparkles className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="font-heading font-bold text-indigo-700">{user?.gems || 0} Gems</span>
                    </div>
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-6 py-8">
                {/* Boosters Section */}
                <div className="mb-12">
                    <div className="mb-8">
                        <h2 className="font-heading font-bold text-2xl text-slate-800 mb-2">Power-Ups</h2>
                        <p className="text-slate-500">Spend your gems to accelerate your learning.</p>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-3 gap-6">
                            {items.map((item) => (
                                <div key={item.id} className="bg-white rounded-3xl p-6 border-2 border-slate-100 hover:border-indigo-200 transition-all shadow-sm flex flex-col items-center text-center group">
                                    <div className="w-20 h-20 bg-slate-50 group-hover:bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 transition-colors">
                                        {itemIcons[item.id] || <ShoppingBag className="w-10 h-10" />}
                                    </div>

                                    <h3 className="font-heading font-bold text-lg text-slate-800 mb-2">{item.name}</h3>
                                    <p className="text-xs text-slate-500 leading-relaxed mb-6 flex-1 italic">
                                        {item.description}
                                    </p>

                                    <button
                                        onClick={() => handleBuyItem(item.id)}
                                        disabled={buying === item.id || (user?.gems || 0) < item.cost}
                                        className={`w-full py-3 rounded-2xl font-heading font-bold flex items-center justify-center gap-2 transition-all ${(user?.gems || 0) >= item.cost
                                            ? 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-100 active:scale-95'
                                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                            }`}
                                    >
                                        {buying === item.id ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <Sparkles className="w-3.5 h-3.5" />
                                                <span>{item.cost} Gems</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Gem Store Section */}
                <div className="mb-12">
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            <h2 className="font-heading font-bold text-2xl text-slate-800 mb-2">Gem Store</h2>
                            <p className="text-slate-500">Need more gems? Top up your balance here.</p>
                        </div>
                        <div className="hidden sm:block">
                            <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-xl border border-amber-100">
                                <CreditCard className="w-4 h-4 text-amber-500" />
                                <span className="text-xs font-bold text-amber-700">Safe Checkout</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {gemPackages.map((pkg) => (
                            <div
                                key={pkg.id}
                                className={`bg-white rounded-3xl p-6 border-2 transition-all shadow-sm flex flex-col items-center text-center cursor-pointer hover:-translate-y-1 ${selectedPackage?.id === pkg.id ? 'border-amber-400 bg-amber-50/30' : 'border-slate-100 hover:border-amber-200'
                                    }`}
                                onClick={() => setSelectedPackage(pkg)}
                            >
                                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4">
                                    {pkg.icon === 'fist' && <Gem className="w-8 h-8 text-sky-400 animate-pulse" />}
                                    {pkg.icon === 'pouch' && <ShoppingBag className="w-8 h-8 text-indigo-400" />}
                                    {pkg.icon === 'chest' && <Package className="w-8 h-8 text-amber-500" />}
                                </div>

                                <h3 className="font-heading font-bold text-lg text-slate-800">{pkg.name}</h3>
                                <div className="flex items-center gap-1.5 mb-6 text-amber-600">
                                    <Sparkles className="w-4 h-4 fill-amber-500" />
                                    <span className="font-heading font-extrabold text-xl">{pkg.amount}</span>
                                </div>

                                <div className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-heading font-bold text-sm shadow-md">
                                    ₹{pkg.price}
                                </div>
                            </div>
                        ))}
                    </div>

                    {selectedPackage && (
                        <div className="mt-8 animate-in slide-in-from-bottom-4 duration-500">
                            <button
                                onClick={() => setShowCheckout(true)}
                                className="w-full bg-gradient-to-r from-amber-400 to-orange-500 py-5 rounded-3xl text-white font-heading font-bold text-lg shadow-xl shadow-orange-100 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
                            >
                                <CreditCard className="w-6 h-6" />
                                Purchase {selectedPackage.amount} Gems
                            </button>
                        </div>
                    )}
                </div>

                {/* Info Card */}
                <div className="mt-12 bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                        <div className="flex-1">
                            <h3 className="font-heading font-bold text-2xl mb-3">Stratos Premium Benefits</h3>
                            <p className="text-slate-400 text-sm leading-relaxed mb-6">
                                Purchasing gems helps us maintain the app and develop new features for the community.
                                Thank you for being part of our journey!
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                                    <span className="text-xs font-bold">No Ads</span>
                                </div>
                                <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                                    <span className="text-xs font-bold">Priority Support</span>
                                </div>
                                <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                                    <span className="text-xs font-bold">Exclusive Badges</span>
                                </div>
                            </div>
                        </div>
                        <div className="w-32 h-32 flex-shrink-0 bg-indigo-500/20 rounded-full flex items-center justify-center">
                            <Shield className="w-16 h-16 text-indigo-400 opacity-50" />
                        </div>
                    </div>
                    <Sparkles className="absolute right-[-20px] bottom-[-20px] w-48 h-48 text-white/5 rotate-12" />
                </div>
            </main>

            {/* Checkout Modal */}
            {showCheckout && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => !isProcessing && setShowCheckout(false)} />
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="font-heading font-bold text-2xl text-slate-800">Secure Checkout</h2>
                                <button onClick={() => setShowCheckout(false)} className="p-2 hover:bg-slate-100 rounded-full">
                                    <X className="w-6 h-6 text-slate-400" />
                                </button>
                            </div>

                            <div className="bg-slate-50 rounded-3xl p-6 mb-8 border border-slate-100">
                                <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                                            <Gem className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800">{selectedPackage?.name}</p>
                                            <p className="text-xs text-slate-500">{selectedPackage?.amount} Gems</p>
                                        </div>
                                    </div>
                                    <p className="font-heading font-bold text-lg text-slate-800">₹{selectedPackage?.price}</p>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500">Order Summary</span>
                                    <span className="font-bold text-slate-800">₹{selectedPackage?.price}</span>
                                </div>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Card Number"
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-10 py-4 outline-none focus:border-indigo-500 transition-all font-mono"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="text" placeholder="MM/YY" className="bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-indigo-500 transition-all" />
                                    <input type="text" placeholder="CVC" className="bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-indigo-500 transition-all" />
                                </div>
                            </div>

                            <button
                                onClick={handleGemPurchase}
                                disabled={isProcessing}
                                className={`w-full py-5 rounded-3xl font-heading font-bold text-lg flex items-center justify-center gap-3 transition-all ${isProcessing ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white hover:bg-black shadow-xl active:scale-[0.98]'
                                    }`}
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                                        <span>Processing...</span>
                                    </>
                                ) : (
                                    <>
                                        <Lock className="w-5 h-5" />
                                        <span>Pay ₹{selectedPackage?.price}</span>
                                    </>
                                )}
                            </button>

                            <div className="mt-6 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                <Shield className="w-3 h-3" />
                                Encrypted & Secure Payment
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Shop;
