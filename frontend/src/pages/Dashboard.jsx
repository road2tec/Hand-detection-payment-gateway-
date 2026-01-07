import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, RefreshCcw, Zap, Wallet,
    TrendingUp, ShieldCheck, Activity, Calendar, Download, Plus
} from 'lucide-react';
import Navbar from '../components/Navbar';
import PaymentModal from '../components/PaymentModal';
import MetricCards from '../components/dashboard/MetricCards';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import PaymentTable from '../components/dashboard/PaymentTable';
import BiometricStats from '../components/dashboard/BiometricStats';
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

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));

        fetchData(true);
        const interval = setInterval(() => fetchData(), 5000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const handlePayClick = (amount) => {
        setSelectedAmount(amount);
        setShowPaymentModal(true);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-dark flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400 animate-pulse font-bold tracking-widest uppercase text-xs">Initializing Neural Dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark text-white pb-20 relative overflow-hidden">
            {/* Background Gradient Accents */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 blur-[150px] -z-10 rounded-full" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/5 blur-[120px] -z-10 rounded-full" />

            <main className="max-w-[1700px] mx-auto px-6 pt-32">
                {/* Dashboard Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-12">
                    <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
                        <div className="flex items-center gap-3 text-primary mb-3">
                            <LayoutDashboard size={22} className="drop-shadow-[0_0_8px_rgba(30,174,152,0.5)]" />
                            <span className="text-xs font-black tracking-[0.3em] uppercase">Security Engine V2.0</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">
                            Welcome, <span className="text-gradient">{user?.name?.split(' ')[0] || 'User'}</span>
                        </h1>
                        <p className="text-gray-400 flex items-center gap-2 font-medium">
                            <Calendar size={16} />
                            System active for {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                    </motion.div>

                    <div className="flex items-center gap-4">
                        <div className="hidden sm:block glass-card py-3 px-6 border-primary/20">
                            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Last Data Sync</p>
                            <p className="text-sm font-mono text-primary font-bold">{lastUpdated.toLocaleTimeString()}</p>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => fetchData(true)}
                            className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-gray-400 hover:text-white"
                        >
                            <RefreshCcw size={20} />
                        </motion.button>
                        <button className="gradient-button flex items-center gap-3 px-8 py-4 rounded-2xl shadow-xl shadow-primary/20">
                            <Download size={20} />
                            <span className="font-black uppercase text-sm tracking-wider">Reports</span>
                        </button>
                    </div>
                </div>

                {/* Real-time Metric Cards */}
                <MetricCards metrics={metrics} />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left & Middle: Center Console */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* One-Tap Payment Section (Preserving existing work) */}
                        <section className="glass-card p-8 border-primary/10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 -rotate-45 translate-x-16 -translate-y-16 group-hover:scale-150 transition-transform duration-700" />
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-black flex items-center gap-3 italic">
                                    <Zap className="text-warning-400 w-7 h-7 fill-warning-400/20" />
                                    Instant Biometric Checkout
                                </h2>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Secure Node Online</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                                {[100, 500, 1000, 2000, 5000, 10000].map((amt) => (
                                    <motion.button
                                        key={amt}
                                        whileHover={{ y: -5, scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handlePayClick(amt)}
                                        className="p-6 bg-white/5 border border-white/10 rounded-3xl hover:bg-primary/20 hover:border-primary/40 transition-all text-center relative overflow-hidden group/btn"
                                    >
                                        <p className="text-[10px] text-gray-500 font-black mb-1 uppercase tracking-tighter opacity-70">Amount</p>
                                        <p className="text-2xl font-black text-white group-hover/btn:text-primary transition-colors">₹{amt}</p>
                                        <div className="absolute bottom-0 left-0 h-1 bg-primary w-0 group-hover/btn:w-full transition-all duration-300" />
                                    </motion.button>
                                ))}

                                {/* Custom Amount Card */}
                                <div className="p-6 bg-white/5 border border-dashed border-white/20 rounded-3xl hover:bg-white/10 transition-all text-center flex flex-col justify-center gap-2 group/custom">
                                    <p className="text-[10px] text-gray-500 font-black mb-1 uppercase tracking-tighter opacity-70">Custom Amount</p>
                                    <div className="relative">
                                        <span className="absolute left-1 top-1/2 -translate-y-1/2 text-primary font-black">₹</span>
                                        <input
                                            type="number"
                                            value={customAmount}
                                            onChange={(e) => setCustomAmount(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full bg-dark/40 border border-white/10 rounded-xl py-2 pl-6 pr-2 text-sm font-black text-white focus:border-primary outline-none transition-all"
                                        />
                                    </div>
                                    <button
                                        disabled={!customAmount || parseFloat(customAmount) <= 0}
                                        onClick={() => handlePayClick(parseFloat(customAmount))}
                                        className="w-full py-2 bg-primary text-white text-[10px] font-black uppercase rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Plus size={14} /> Pay Custom
                                    </button>
                                </div>
                            </div>
                        </section>

                        {/* Recent Transactions Table */}
                        <PaymentTable payments={payments} />

                        {/* Analytics Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <BiometricStats stats={stats} />

                            {/* Security Features (Existing aesthetics) */}
                            <div className="glass-card p-8 flex flex-col justify-between">
                                <div>
                                    <h3 className="text-lg font-black mb-6 flex items-center gap-2 text-primary uppercase tracking-widest">
                                        <ShieldCheck className="w-5 h-5" />
                                        Advanced Guard
                                    </h3>
                                    <p className="text-sm text-gray-400 mb-8 leading-relaxed">
                                        Multi-point hand geometry extraction and volumetric analysis are active for your account.
                                    </p>
                                </div>
                                <div className="space-y-4">
                                    <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                        <div className="flex justify-between text-[10px] font-black text-primary uppercase mb-2 tracking-tighter">
                                            <span>Feature Vector Integrity</span>
                                            <span>99.9%</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <motion.div initial={{ width: 0 }} animate={{ width: '99.9%' }} className="h-full bg-primary" />
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => window.location.href = '/upgrade-biometrics'}
                                        className="w-full py-4 mb-3 rounded-2xl bg-primary/20 border border-primary/40 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary/30 transition-all text-primary"
                                    >
                                        Upgrade Biometric Signature
                                    </button>
                                    <button className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all text-gray-400">
                                        Configure Security Policy
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Live Activity Feed */}
                    <div className="lg:col-span-4 h-full">
                        <ActivityFeed activities={activities} />
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
