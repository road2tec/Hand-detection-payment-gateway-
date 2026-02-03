import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, RefreshCcw, Zap, Wallet,
    ShieldCheck, Activity, Calendar, Download, Plus,
    History, Fingerprint, Bell, User, ArrowRight, CheckCircle, AlertCircle, Info, Landmark
} from 'lucide-react';
import Navbar from '../components/Navbar';
import PaymentModal from '../components/PaymentModal';
import { dashboardService } from '../services/api';
import { containerVariants, itemVariants } from '../animations/motionVariants';

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedAmount, setSelectedAmount] = useState(0);
    const [metrics, setMetrics] = useState(null);
    const [activities, setActivities] = useState([]);
    const [payments, setPayments] = useState([]);
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [customAmount, setCustomAmount] = useState('');

    const fetchData = useCallback(async (isInitial = false) => {
        if (isInitial) setIsLoading(true);
        try {
            const [mRes, aRes, pRes, sRes] = await Promise.all([
                dashboardService.getMetrics(),
                dashboardService.getActivity(),
                dashboardService.getPayments(),
                dashboardService.getBiometricStats(),
            ]);
            setMetrics(mRes.data);
            setActivities(aRes.data);
            setPayments(pRes.data);
            setStats(sRes.data);
            setLastUpdated(new Date());
        } catch (error) {
            console.error("Dashboard Fetch Error:", error);
        } finally {
            if (isInitial) setIsLoading(false);
        }
    }, []);

    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser.is_admin) {
                navigate('/admin');
                return;
            }
            setUser(parsedUser);
        }

        fetchData(true);
        const interval = setInterval(() => fetchData(), 5000);
        return () => clearInterval(interval);
    }, [fetchData, navigate]);

    const handlePayClick = (amount) => {
        setSelectedAmount(amount);
        setShowPaymentModal(true);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-dark flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400 animate-pulse font-bold tracking-widest uppercase text-xs">Initializing Secure Wallet...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark-darker text-white pb-20 relative overflow-hidden font-sans selection:bg-primary/30">
            {/* Background Decorative Elements */}
            <div className="fixed top-0 right-0 w-[800px] h-[800px] bg-primary/20 blur-[180px] rounded-full -mr-60 -mt-60 pointer-events-none -z-0" />
            <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-secondary/10 blur-[150px] rounded-full -ml-40 -mb-40 pointer-events-none -z-0" />

            <main className="max-w-[1600px] mx-auto px-8 pt-32 relative z-10">

                {/* 1️⃣ IMMERSIVE HERO SECTION */}
                <div className="relative mb-20">
                    {/* Floating 3D HUD Visualization */}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/2 h-[500px] z-0 pointer-events-none hidden xl:block">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, rotateY: 30 }}
                            animate={{ opacity: 0.8, scale: 1, rotateY: 0 }}
                            transition={{ duration: 2, ease: "easeOut" }}
                            className="w-full h-full relative"
                        >
                            <div className="w-full h-full relative flex items-center justify-center">
                                {/* Geometric Hex Grid */}
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                                <div className="relative w-64 h-64 border-2 border-primary/40 rounded-full animate-pulse flex items-center justify-center shadow-[0_0_50px_rgba(99,102,241,0.2)]">
                                    <Fingerprint size={120} className="text-primary/40 animate-pulse" />
                                    <div className="absolute inset-0 border-t-2 border-primary rounded-full animate-spin" />
                                </div>
                            </div>
                            {/* Orbital Light Ring */}
                            <div className="absolute inset-0 border-[1px] border-primary/20 rounded-full animate-spin-slow opacity-20" />
                        </motion.div>
                    </div>

                    <div className="relative z-10 flex flex-col gap-10">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <div className="flex items-center gap-4 text-primary mb-6">
                                <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 shadow-glow">
                                    <ShieldCheck size={28} className="text-primary" />
                                </div>
                                <div className="h-[2px] w-12 bg-gradient-to-r from-primary to-transparent" />
                                <span className="text-xs font-black tracking-[0.5em] uppercase text-primary/80">Neural Biometric Active</span>
                            </div>
                            <h1 className="text-7xl md:text-8xl font-black tracking-tighter mb-4 italic leading-[0.9]">
                                COMMAND <br />
                                <span className="text-gradient">INTERFACE</span>
                            </h1>
                            <p className="text-gray-400 font-bold text-xl uppercase tracking-[0.3em] opacity-60">
                                Authenticated: {user?.name || 'Guest User'}
                            </p>
                        </motion.div>

                        <div className="flex items-center gap-6">
                            <motion.button
                                whileHover={{ scale: 1.05, x: 5 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => fetchData(true)}
                                className="glass-button flex items-center gap-3 active:scale-95"
                            >
                                <RefreshCcw size={18} className="text-primary" />
                                <span className="text-xs font-black uppercase tracking-widest">Resync Core</span>
                            </motion.button>
                            <div className="h-10 w-[1px] bg-white/10" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase text-gray-500 tracking-tighter">Last Sync</span>
                                <span className="text-xs font-mono text-primary">{lastUpdated.toLocaleTimeString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Floating Metric HUDs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20 relative z-10">
                    {[
                        { title: "Recent Auth", value: `₹${payments[0]?.amount || '0.00'}`, icon: Wallet, color: "text-indigo-400", sub: "Verified" },
                        { title: "Security Node", value: "Level 5", icon: ShieldCheck, color: "text-emerald-400", sub: "Trusted" },
                        { title: "Sync Count", value: payments.length, icon: Activity, color: "text-pink-400", sub: "Active" },
                        { title: "Threat Level", value: "0", icon: Bell, color: "text-amber-400", sub: "Optimal" }
                    ].map((m, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="glass-card p-8 glass-card-hover group relative overflow-hidden"
                        >
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br from-white/10 to-transparent rounded-full opacity-20 blur-2xl group-hover:scale-150 transition-transform duration-700" />
                            <div className="flex justify-between items-start mb-6">
                                <div className={`p-4 bg-white/5 rounded-2xl ${m.color.replace('text', 'border')} border transition-all duration-500`}>
                                    <m.icon size={24} className={m.color} />
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${m.color} opacity-60`}>{m.sub}</span>
                            </div>
                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">{m.title}</p>
                            <h3 className="text-4xl font-black italic tracking-tighter">{m.value}</h3>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* LEFT SIDE (Points 2, 3) */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* 2️⃣ Make Payment Section */}
                        <section className="glass-card p-12 border-primary/20 bg-primary/5 relative overflow-hidden group shadow-2xl">
                            <div className="absolute right-0 top-0 w-1/3 h-full opacity-[0.02] pointer-events-none group-hover:opacity-[0.05] transition-opacity bg-gradient-to-l from-secondary/30 to-transparent flex items-center justify-end pr-10">
                                <Zap size={150} className="text-secondary opacity-30 group-hover:scale-110 transition-transform duration-1000" />
                            </div>

                            <div className="flex items-center justify-between mb-10 relative z-10">
                                <h2 className="text-3xl font-black flex items-center gap-4 italic uppercase tracking-tighter">
                                    <div className="p-3 bg-primary/20 rounded-2xl shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                                        <Zap className="text-primary w-8 h-8" />
                                    </div>
                                    Execute Payment
                                </h2>
                                <div className="flex items-center gap-3 bg-green-500/10 px-4 py-2 rounded-full border border-green-500/20">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-green-500">Security Node Stable</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Enter Amount (₹)</label>
                                        <div className="relative">
                                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-primary font-black text-2xl">₹</span>
                                            <input
                                                type="number"
                                                value={customAmount}
                                                onChange={(e) => setCustomAmount(e.target.value)}
                                                placeholder="0.00"
                                                className="w-full bg-dark/60 border-2 border-white/10 rounded-3xl py-6 pl-12 pr-6 text-3xl font-black text-white focus:border-primary outline-none transition-all placeholder:text-gray-700"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        disabled={!customAmount || parseFloat(customAmount) <= 0}
                                        onClick={() => handlePayClick(parseFloat(customAmount))}
                                        className="w-full gradient-button flex items-center justify-center gap-3 py-6 rounded-3xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-98 transition-all disabled:opacity-30 disabled:hover:scale-100"
                                    >
                                        <ArrowRight size={24} />
                                        <span className="text-lg font-black uppercase tracking-wider">Proceed to Payment</span>
                                    </button>
                                </div>
                                <div className="bg-white/5 rounded-3xl p-6 border border-white/5 flex flex-col justify-between">
                                    <h4 className="text-[10px] font-black text-primary uppercase tracking-widest mb-4">Security Policy Notice</h4>
                                    <ul className="space-y-4 text-sm font-medium text-gray-400">
                                        <li className="flex gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                            Palm verification required for every transaction.
                                        </li>
                                        <li className="flex gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-secondary mt-1.5 shrink-0" />
                                            Transactions &gt; ₹2,000 require your 4-digit PIN.
                                        </li>
                                        <li className="flex gap-3 text-amber-500/80">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                                            Transactions &gt; ₹10,000 will send an OTP to your email.
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* 3️⃣ Payment History */}
                        <section className="glass-card overflow-hidden border-white/10 bg-white/[0.01]">
                            <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                                <h2 className="text-2xl font-black flex items-center gap-4 italic uppercase tracking-tighter">
                                    <div className="p-2 bg-indigo-500/20 rounded-xl">
                                        <History className="text-indigo-400 w-6 h-6" />
                                    </div>
                                    Audit Trail
                                </h2>
                                <button className="text-[11px] font-black text-primary uppercase tracking-widest hover:brightness-125 hover:underline transition-all">Export Report</button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-white/5 text-[10px] uppercase font-black tracking-widest text-gray-500">
                                        <tr>
                                            <th className="px-6 py-4">Protocol Date</th>
                                            <th className="px-6 py-4">Recipient Node & Bank</th>
                                            <th className="px-6 py-4">Amount</th>
                                            <th className="px-6 py-4">Security Logic</th>
                                            <th className="px-6 py-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 text-sm font-medium">
                                        {payments.slice(0, 10).map((payment) => (
                                            <tr key={payment._id || payment.id} className="hover:bg-white/5 transition-colors group">
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col">
                                                        <span className="text-white font-bold">{new Date(payment.timestamp).toLocaleDateString()}</span>
                                                        <span className="text-[10px] text-gray-500 font-mono italic">{new Date(payment.timestamp).toLocaleTimeString()}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col">
                                                        <span className="text-white font-black uppercase tracking-tighter">{payment.recipient_details?.name || 'External Recipient'}</span>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-[10px] text-primary font-mono">{payment.recipient_details?.account_masked || '****0000'}</span>
                                                            <div className="w-[1px] h-2 bg-white/10" />
                                                            <span className="text-[9px] text-gray-500 font-bold uppercase">{payment.recipient_details?.bank || 'Standard Bank'}</span>
                                                        </div>
                                                        <span className="text-[8px] text-gray-600 font-mono mt-1">IFSC: {payment.recipient_details?.ifsc || 'N/A'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-lg font-black italic text-gradient">₹{payment.amount ? parseFloat(payment.amount).toLocaleString() : '0'}</td>
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col gap-1">
                                                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest text-center ${payment.amount >= 10000 ? 'bg-amber-500/10 text-amber-500' :
                                                            payment.amount >= 2000 ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'
                                                            }`}>
                                                            {payment.amount >= 10000 ? 'Palm + OTP' : payment.amount >= 2000 ? 'Palm + PIN' : 'Palm Only'}
                                                        </span>
                                                        {payment.razorpay_payment_id && (
                                                            <span className="text-[8px] text-gray-600 font-mono uppercase truncate w-24">ID: {payment.razorpay_payment_id}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${payment.status === 'SUCCESS' || payment.status === 'COMPLETED' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} />
                                                        <span className={`text-[10px] font-black uppercase tracking-widest ${payment.status === 'SUCCESS' || payment.status === 'COMPLETED' ? 'text-green-500' : 'text-red-500'}`}>{payment.status}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {payments.length === 0 && (
                                <div className="py-20 text-center text-gray-600 font-bold uppercase tracking-widest text-xs">
                                    No transaction history found.
                                </div>
                            )}
                        </section>
                    </div>

                    {/* RIGHT SIDE (Points 4, 5, 6) */}
                    <div className="lg:col-span-4 space-y-8">

                        {/* 4️⃣ Biometric Status */}
                        <section className="glass-card p-8 border-white/10 relative overflow-hidden group">
                            <div className="absolute -right-8 -bottom-8 text-primary opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-1000 group-hover:scale-110 transition-transform">
                                <Fingerprint size={200} />
                            </div>
                            <h3 className="text-sm font-black text-primary uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                                <div className="p-2 bg-primary/20 rounded-lg">
                                    <Fingerprint size={20} />
                                </div>
                                Biometric Signature
                            </h3>
                            <div className="space-y-4 relative z-10">
                                <div className="flex justify-between items-center p-5 bg-white/[0.03] rounded-[1.5rem] border border-white/10 backdrop-blur-md">
                                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Palm Registered</span>
                                    <span className="px-4 py-1.5 rounded-full bg-green-500/10 text-green-500 text-[10px] font-black uppercase tracking-widest border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.2)]">TRUSTED (VALID)</span>
                                </div>
                                <div className="flex justify-between items-center p-5 bg-white/[0.03] rounded-[1.5rem] border border-white/10">
                                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Integrity Rank</span>
                                    <span className="text-2xl font-black text-white italic tracking-tighter">LEVEL 5</span>
                                </div>
                                <div className="p-5 bg-indigo-500/10 border border-indigo-500/20 rounded-[1.5rem] flex items-center gap-4">
                                    <div className="p-2 bg-indigo-500/20 rounded-lg">
                                        <Info size={18} className="text-indigo-400" />
                                    </div>
                                    <p className="text-[10px] font-black text-indigo-300 leading-tight uppercase tracking-widest opacity-80">
                                        Data secured via AES-256 Neural feature vectors.
                                    </p>
                                </div>
                                <button
                                    onClick={() => navigate('/upgrade-biometrics')}
                                    className="w-full py-5 rounded-[1.5rem] bg-white/5 border border-white/10 text-[11px] font-black uppercase tracking-[0.3em] hover:bg-primary hover:text-dark hover:border-primary transition-all shadow-xl hover:shadow-primary/20 flex items-center justify-center gap-3 group"
                                >
                                    <Fingerprint size={16} className="group-hover:animate-pulse" />
                                    Re-Sync Palm Signature
                                </button>
                            </div>
                        </section>

                        {/* NEW: Node Registry (Previously "Where are bank details") */}
                        <section className="glass-card p-8 border-white/10 bg-gradient-to-br from-primary/5 to-transparent">
                            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Landmark size={18} className="text-primary" />
                                Verified Node Registry
                            </h3>
                            <div className="space-y-4">
                                {payments && payments.length > 0 ? (
                                    Array.from(new Set(payments.filter(p => p.recipient_details?.account_masked).map(p => p.recipient_details.account_masked))).slice(0, 3).map((acc, idx) => {
                                        const p = payments.find(pay => pay.recipient_details?.account_masked === acc);
                                        if (!p) return null;
                                        return (
                                            <div key={idx} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-primary/20 transition-all cursor-pointer group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black uppercase italic">
                                                        {p.recipient_details?.name?.[0] || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-gray-200 uppercase tracking-tighter">{p.recipient_details?.name || 'Unknown'}</p>
                                                        <p className="text-[9px] text-gray-500 font-mono italic">{acc || '****0000'}</p>
                                                    </div>
                                                </div>
                                                <ArrowRight size={14} className="text-gray-600 group-hover:text-primary transition-all" />
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-[10px] font-bold text-gray-600 uppercase text-center py-4 tracking-widest">No verified destination nodes.</p>
                                )}
                            </div>
                        </section>

                        {/* 5️⃣ Security Notifications */}
                        <section className="glass-card p-8 border-white/5">
                            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                                <Bell size={18} />
                                Security Alert Feed
                            </h3>
                            <div className="space-y-6">
                                {activities.slice(0, 4).map((activity, idx) => (
                                    <div key={idx} className="flex gap-4">
                                        <div className={`mt-1 p-2 rounded-lg shrink-0 ${activity.status === 'SUCCESS' || activity.status === 'VERIFIED' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                                            }`}>
                                            {activity.status === 'SUCCESS' || activity.status === 'VERIFIED' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-gray-200 tracking-tighter">{activity.event_type.replace(/_/g, ' ')}</p>
                                            <p className="text-xs text-gray-500 font-medium leading-tight mt-0.5">{activity.details?.message || activity.status}</p>
                                            <p className="text-[9px] text-gray-600 mt-1">{new Date(activity.timestamp).toLocaleTimeString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* 6️⃣ User Profile */}
                        <section className="glass-card p-10 border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent relative overflow-hidden">
                            <div className="absolute right-0 bottom-0 w-32 h-32 bg-primary/5 blur-3xl pointer-events-none" />
                            <h3 className="text-sm font-black text-gray-500 uppercase tracking-[0.3em] mb-10 flex items-center gap-3">
                                <div className="p-2 bg-white/5 rounded-lg">
                                    <User size={18} />
                                </div>
                                Digital Identity
                            </h3>
                            <div className="flex items-center gap-8 mb-10">
                                <div className="w-20 h-20 rounded-[2rem] bg-indigo-500/20 flex items-center justify-center border-2 border-indigo-500/40 shadow-2xl shadow-indigo-500/20 relative group">
                                    <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-0 group-hover:opacity-30 transition-opacity" />
                                    <span className="text-3xl font-black text-indigo-400 relative z-10">{user?.name?.charAt(0)}</span>
                                </div>
                                <div>
                                    <h4 className="text-2xl font-black italic uppercase tracking-tighter">{user?.name}</h4>
                                    <p className="text-xs font-black text-gray-500 tracking-[0.2em] mt-1">{user?.email?.split('@')[0]}***@{user?.email?.split('@')[1]}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-5 bg-white/[0.02] rounded-[1.5rem] border border-white/10">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 opacity-60">Verified Date</p>
                                    <p className="text-sm font-black text-white uppercase italic">{new Date(user?.created_at).toLocaleDateString()}</p>
                                </div>
                                <div className="p-5 bg-white/[0.02] rounded-[1.5rem] border border-white/10">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 opacity-60">Node Status</p>
                                    <p className="text-sm font-black text-green-500 uppercase italic flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                                        Active
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => { localStorage.clear(); navigate('/login'); }}
                                className="w-full mt-10 py-5 rounded-[1.5rem] bg-red-500/10 border border-red-500/20 text-[11px] font-black uppercase tracking-[0.4em] hover:bg-red-500/20 transition-all text-red-500 group"
                            >
                                <span className="group-hover:tracking-[0.6em] transition-all">Secure Termination</span>
                            </button>
                        </section>
                    </div>
                </div>
            </main>

            {/* Hidden Modal */}
            <PaymentModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                amount={selectedAmount}
                onSuccess={() => fetchData()}
            />
        </div>
    );
};

export default Dashboard;
