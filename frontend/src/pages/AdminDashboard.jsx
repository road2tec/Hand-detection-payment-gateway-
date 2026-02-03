import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldCheck, AlertTriangle, Activity, Users, FileText,
    Search, RefreshCw, Key, Mail, Wallet, Shield, CheckCircle,
    XCircle, Clock, Info, ExternalLink, Power, Fingerprint,
    LayoutDashboard, List, Bell, Lock, UserCheck, Smartphone, Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../services/api';
import Loader from '../components/Loader';
import { containerVariants, itemVariants } from '../animations/motionVariants';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview'); // overview, users, transactions, alerts
    const [stats, setStats] = useState(null);
    const [logs, setLogs] = useState([]);
    const [users, setUsers] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [adminUser, setAdminUser] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, logsRes, usersRes, alertsRes] = await Promise.all([
                adminService.getStats(),
                adminService.getLogs(filter),
                adminService.getUsers(),
                adminService.getAlerts()
            ]);
            setStats(statsRes.data);
            setLogs(logsRes.data);
            setUsers(usersRes.data);
            setAlerts(alertsRes.data);
        } catch (err) {
            console.error("Admin Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            if (!parsedUser.is_admin) {
                navigate('/dashboard');
                return;
            }
            setAdminUser(parsedUser);
        } else {
            navigate('/login');
            return;
        }

        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [filter, navigate]);

    const MetricCard = ({ title, value, icon: Icon, color, subtext }) => (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 border-white/5 relative overflow-hidden group"
        >
            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-700 ${color}`} />
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${color} bg-opacity-20`}>
                    <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
                </div>
                {subtext && <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{subtext}</span>}
            </div>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">{title}</p>
            <h3 className="text-3xl font-black">{value}</h3>
        </motion.div>
    );

    const SidebarItem = ({ id, label, icon: Icon }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === id
                ? 'bg-primary text-dark font-black shadow-lg shadow-primary/20'
                : 'text-gray-400 hover:bg-white/5 hover:text-white font-bold'
                }`}
        >
            <Icon size={20} />
            <span className="text-xs uppercase tracking-widest">{label}</span>
        </button>
    );

    if (loading && !stats) return (
        <div className="h-screen w-screen bg-dark-darker flex items-center justify-center">
            <Loader />
        </div>
    );

    return (
        <div className="min-h-screen flex bg-dark-darker overflow-hidden font-sans selection:bg-primary/30">
            {/* 🛡️ STICKY SIDEBAR */}
            <aside className="w-80 h-screen sticky top-0 bg-dark-lighter/40 backdrop-blur-3xl border-r border-white/10 flex flex-col p-8 z-[100] relative group">
                {/* Sidebar Background Image Overlay */}
                <div className="absolute inset-0 opacity-[0.03] grayscale pointer-events-none group-hover:opacity-[0.07] transition-opacity duration-700">
                    <img src="/C:/Users/punam/.gemini/antigravity/brain/afc11ba6-60bb-45de-a0c2-488817d83b0f/cybersecurity_network_hub_1770105348426.png" className="w-full h-full object-cover" alt="" />
                </div>

                <div className="flex items-center gap-4 text-primary mb-12 relative z-10">
                    <div className="p-2 bg-primary/20 rounded-2xl">
                        <Shield size={32} className="animate-pulse" />
                    </div>
                    <span className="text-2xl font-black tracking-tighter italic text-white drop-shadow-md">SECURITY <span className="text-primary">OS</span></span>
                </div>

                <nav className="flex-1 space-y-2">
                    <SidebarItem id="overview" label="Overview" icon={LayoutDashboard} />
                    <SidebarItem id="users" label="Registered Users" icon={Users} />
                    <SidebarItem id="transactions" label="All Transactions" icon={List} />
                    <SidebarItem id="alerts" label="Security Alerts" icon={Bell} />
                </nav>

                <div className="mt-auto pt-8 border-t border-white/5">
                    <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10 mb-6">
                        <div className="p-2 bg-primary/20 rounded-lg">
                            <AdminUserIcon className="text-primary w-4 h-4" />
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-[10px] text-gray-400 font-black uppercase truncate">{adminUser?.name}</p>
                            <p className="text-[8px] text-primary font-bold uppercase tracking-tighter">System Admin</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { localStorage.clear(); navigate('/login'); }}
                        className="w-full flex items-center justify-center gap-3 p-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-2xl transition-all border border-red-500/20 text-xs font-black uppercase tracking-widest group"
                    >
                        <Power size={16} className="group-hover:rotate-90 transition-transform" />
                        Logout Session
                    </button>
                </div>
            </aside>

            {/* 🚀 MAIN CONTENT */}
            <main className="flex-1 h-screen overflow-y-auto pt-8 px-12 pb-20 scrollbar-hide relative">
                {/* Main Content Decorative Background */}
                <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-primary/20 blur-[150px] rounded-full -mr-40 -mt-40 pointer-events-none" />
                <div className="fixed bottom-0 left-80 w-[500px] h-[500px] bg-secondary/10 blur-[120px] rounded-full -ml-40 -mb-40 pointer-events-none" />

                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-[1600px] mx-auto relative z-10">

                    {/* Header */}
                    <header className="flex justify-between items-center mb-12 bg-white/[0.02] p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-md">
                        <div>
                            <p className="text-[11px] text-primary font-black tracking-[0.5em] uppercase mb-2 drop-shadow-sm">Security Engine V2.0 / {activeTab}</p>
                            <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white">
                                System <span className="text-gradient">Control Center</span>
                            </h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="glass-card py-3 px-6 border-primary/20 bg-primary/5 flex items-center gap-3">
                                <Activity size={16} className="text-primary animate-pulse" />
                                <span className="text-[10px] font-mono text-primary font-black uppercase">Service Status: Online</span>
                            </div>
                            <button onClick={fetchData} className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all text-gray-400">
                                <RefreshCw className={loading ? 'animate-spin' : ''} size={20} />
                            </button>
                        </div>
                    </header>

                    {/* Dynamic Tab Rendering */}
                    <AnimatePresence mode="wait">
                        {activeTab === 'overview' && (
                            <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                                {/* Stats Cards */}
                                <div className="grid grid-cols-5 gap-6 mb-12">
                                    <MetricCard title="Users" value={stats?.total_users || 0} icon={Users} color="bg-indigo-500" />
                                    <MetricCard title="Authorized" value={stats?.completed_payments || 0} icon={ShieldCheck} color="bg-green-500" />
                                    <MetricCard title="Rejected" value={stats?.failed_payments || 0} icon={AlertTriangle} color="bg-red-500" />
                                    <MetricCard title="High Value" value={stats?.high_value_transactions || 0} icon={Wallet} color="bg-amber-500" />
                                    <MetricCard title="Alerts" value={alerts?.length || 0} icon={Bell} color="bg-rose-500" />
                                </div>

                                <div className="grid grid-cols-12 gap-8">
                                    <div className="col-span-8 space-y-8">
                                        <div className="glass-card p-10 border-white/10 relative overflow-hidden group">
                                            {/* Decorative Image */}
                                            <div className="absolute right-0 top-0 w-1/3 h-full opacity-[0.04] pointer-events-none group-hover:opacity-[0.08] transition-opacity">
                                                <img src="/C:/Users/punam/.gemini/antigravity/brain/afc11ba6-60bb-45de-a0c2-488817d83b0f/biometric_hand_scan_viz_1770105321911.png" className="w-full h-full object-cover" alt="" />
                                            </div>

                                            <h2 className="text-2xl font-black mb-8 italic flex items-center gap-4 text-white">
                                                <div className="p-2 bg-primary/20 rounded-xl">
                                                    <Activity className="text-primary w-6 h-6" />
                                                </div>
                                                Live Biometric Pulse
                                            </h2>
                                            {/* (Live Graph Placeholder or Health Summary) */}
                                            <div className="grid grid-cols-3 gap-6 mb-8">
                                                <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                                                    <p className="text-[10px] font-black text-gray-500 uppercase mb-2">Matching Success</p>
                                                    <p className="text-3xl font-black text-green-500">{stats?.biometric_accuracy}%</p>
                                                </div>
                                                <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                                                    <p className="text-[10px] font-black text-gray-500 uppercase mb-2">Total Scans</p>
                                                    <p className="text-3xl font-black text-primary">{stats?.biometric_attempts}</p>
                                                </div>
                                                <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                                                    <p className="text-[10px] font-black text-gray-500 uppercase mb-2">Incident Rate</p>
                                                    <p className="text-3xl font-black text-red-500">{stats?.recent_incidents}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Audit Log Preview */}
                                        <div className="glass-card overflow-hidden border-white/5">
                                            <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                                                <h2 className="text-sm font-black italic uppercase tracking-widest text-gray-400">Recent Stream Logs</h2>
                                            </div>
                                            <div className="p-0 overflow-x-auto">
                                                <table className="w-full text-left">
                                                    <tbody className="divide-y divide-white/5">
                                                        {logs.slice(0, 10).map(log => (
                                                            <tr key={log._id} className="hover:bg-white/5 transition-colors">
                                                                <td className="px-6 py-4 font-mono text-[10px] text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</td>
                                                                <td className="px-6 py-4">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-xs font-bold text-gray-200">{log.user_name}</span>
                                                                        <span className="text-[9px] text-gray-500 italic">{log.user_email}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">{log.event_type.replace('_', ' ')}</span>
                                                                        {log.details?.recipient && (
                                                                            <span className="text-[8px] text-gray-600 uppercase font-bold">To: {log.details.recipient}</span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black ${log.status === 'SUCCESS' || log.status === 'VERIFIED' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                                                        {log.status}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-span-4 space-y-8">
                                        {/* Health Panel */}
                                        <div className="glass-card p-6 border-white/5">
                                            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2 font-mono">
                                                System.Health()
                                            </h3>
                                            <div className="space-y-4">
                                                {['Backend API', 'Security Engine', 'Razorpay', 'Database'].map(svc => (
                                                    <div key={svc} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                                                        <span className="text-xs font-bold">{svc}</span>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                                            <span className="text-[9px] font-black text-green-500 uppercase">100% Stable</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'users' && (
                            <motion.div key="users" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <div className="glass-card overflow-hidden border-white/10 relative">
                                    <div className="absolute right-0 top-0 w-64 h-64 opacity-[0.05] pointer-events-none grayscale translate-x-10 -translate-y-10">
                                        <img src="/C:/Users/punam/.gemini/antigravity/brain/afc11ba6-60bb-45de-a0c2-488817d83b0f/biometric_hand_scan_viz_1770105321911.png" className="w-full h-full object-contain" alt="" />
                                    </div>
                                    <div className="p-8 border-b border-white/10 flex justify-between items-center relative z-10">
                                        <h2 className="text-xl font-black italic flex items-center gap-3 uppercase tracking-tighter">
                                            <Users className="text-indigo-400" />
                                            Identity Registry
                                        </h2>
                                        <div className="relative">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                            <input type="text" placeholder="Search Identity..." className="bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-6 text-sm focus:ring-2 focus:ring-primary outline-none transition-all w-80" />
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-white/5 text-[10px] uppercase font-black tracking-[0.2em] text-gray-500">
                                                <tr>
                                                    <th className="px-8 py-5">Verified User</th>
                                                    <th className="px-8 py-5">Email Address</th>
                                                    <th className="px-8 py-5">Palm Enrollment</th>
                                                    <th className="px-8 py-5">Hand Type</th>
                                                    <th className="px-8 py-5">Registered Since</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {users.map(u => (
                                                    <tr key={u._id} className="hover:bg-white/5 transition-colors">
                                                        <td className="px-8 py-6">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center font-black text-primary">
                                                                    {u.name[0]}
                                                                </div>
                                                                <span className="font-black text-gray-200">{u.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6 font-mono text-xs text-gray-500">{u.email}</td>
                                                        <td className="px-8 py-6">
                                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${u.is_enrolled ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                                                {u.is_enrolled ? 'SECURED' : 'PENDING'}
                                                            </span>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div className="flex items-center gap-2">
                                                                <Fingerprint size={14} className="text-primary" />
                                                                <span className="text-xs font-bold text-gray-400 uppercase">{u.hand_type || 'N/A'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6 text-xs text-gray-500 italic">
                                                            {new Date(u.created_at).toLocaleDateString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'transactions' && (
                            <motion.div key="transactions" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <div className="glass-card p-0 overflow-hidden border-white/10 relative">
                                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.02] pointer-events-none grayscale">
                                        <img src="/C:/Users/punam/.gemini/antigravity/brain/afc11ba6-60bb-45de-a0c2-488817d83b0f/cybersecurity_network_hub_1770105348426.png" className="w-full h-full object-cover" alt="" />
                                    </div>
                                    <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/[0.01] relative z-10">
                                        <h2 className="text-xl font-black italic flex items-center gap-3 uppercase tracking-tighter">
                                            <List className="text-blue-400" />
                                            Financial Audit Trail
                                        </h2>
                                        <div className="flex gap-3">
                                            <select
                                                onChange={(e) => setFilter(e.target.value)}
                                                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-black uppercase outline-none focus:border-primary transition-all"
                                            >
                                                <option value="">All Transactions</option>
                                                <option value="HIGH_VALUE">High Value Only</option>
                                                <option value="FAILED">Review Failures</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-white/5 text-[10px] uppercase font-black tracking-widest text-gray-500 border-b border-white/5">
                                                <tr>
                                                    <th className="px-8 py-6">User (Masked)</th>
                                                    <th className="px-8 py-6">Auth State</th>
                                                    <th className="px-8 py-6">Security Layer</th>
                                                    <th className="px-8 py-6">Value</th>
                                                    <th className="px-8 py-6">Decision</th>
                                                    <th className="px-8 py-6">Timestamp</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/10">
                                                {logs.filter(l => l.event_type.includes('payment') || l.details?.amount).map(log => (
                                                    <tr key={log._id} className="hover:bg-white/[0.03] transition-colors group">
                                                        <td className="px-8 py-6">
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-black text-gray-200">{log.user_name}</span>
                                                                <span className="text-[10px] font-mono text-gray-500 opacity-60">{log.user_email}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-bold text-white uppercase tracking-tighter">{log.details?.recipient || 'External Node'}</span>
                                                                <span className="text-[9px] text-primary font-mono">{log.details?.account || '****7788'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`p-2 rounded-lg ${log.details?.amount >= 10000 ? 'bg-amber-500/10 text-amber-500' : log.details?.amount >= 2000 ? 'bg-indigo-500/10 text-indigo-500' : 'bg-primary/10 text-primary'}`}>
                                                                    {log.details?.amount >= 10000 ? <Lock size={12} /> : log.details?.amount >= 2000 ? <Smartphone size={12} /> : <Fingerprint size={12} />}
                                                                </div>
                                                                <span className="text-[10px] font-black uppercase text-gray-500">
                                                                    {log.details?.amount >= 10000 ? 'Palm + OTP' : log.details?.amount >= 2000 ? 'Palm + PIN' : 'Palm-Only'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6 font-black text-white italic">₹{log.details?.amount}</td>
                                                        <td className="px-8 py-6">
                                                            <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${log.status === 'SUCCESS' || log.status === 'VERIFIED' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                                                {log.status === 'SUCCESS' || log.status === 'VERIFIED' ? 'AUTHORIZED' : 'DENIED'}
                                                            </span>
                                                        </td>
                                                        <td className="px-8 py-6 font-mono text-[10px] text-gray-500 italic">
                                                            {new Date(log.timestamp).toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'alerts' && (
                            <motion.div key="alerts" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                                <div className="grid grid-cols-12 gap-8">
                                    <div className="col-span-8 space-y-6">
                                        <h2 className="text-xl font-black italic flex items-center gap-3 uppercase tracking-tighter mb-4">
                                            <Bell className="text-red-500 animate-bounce" />
                                            Active Security Incidents
                                        </h2>
                                        {alerts.length === 0 ? (
                                            <div className="glass-card p-16 text-center border-dashed border-white/20 bg-primary/[0.01] relative overflow-hidden group">
                                                <div className="absolute inset-0 opacity-[0.05] pointer-events-none grayscale group-hover:scale-110 transition-transform duration-[20s]">
                                                    <img src="/C:/Users/punam/.gemini/antigravity/brain/afc11ba6-60bb-45de-a0c2-488817d83b0f/cybersecurity_network_hub_1770105348426.png" className="w-full h-full object-cover" alt="" />
                                                </div>
                                                <ShieldCheck size={64} className="text-primary mx-auto mb-6 opacity-40 relative z-10" />
                                                <p className="text-xl text-gray-400 font-black uppercase tracking-widest italic relative z-10">All Core Systems Secure</p>
                                                <p className="text-xs text-primary font-bold mt-2 relative z-10 uppercase tracking-tighter">No Passive Incidents Detected in Buffer</p>
                                            </div>
                                        ) : (
                                            alerts.map(alert => (
                                                <motion.div key={alert._id} whileHover={{ x: 10 }} className="glass-card p-6 border-red-500/20 bg-red-500/[0.02] relative overflow-hidden group">
                                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500" />
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex gap-4">
                                                            <div className="p-3 bg-red-500/20 rounded-2xl text-red-500">
                                                                <AlertTriangle size={24} />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-lg font-black italic uppercase italic tracking-tighter text-red-400">Security Breach Detected</h4>
                                                                <p className="text-sm text-gray-400 mb-2">Event: {alert.event_type} | Status: {alert.status}</p>
                                                                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-gray-600">
                                                                    <span className="flex items-center gap-1"><UserCheck size={12} /> {alert.user_name || 'Anonymous'}</span>
                                                                    <span className="flex items-center gap-1"><Clock size={12} /> {new Date(alert.timestamp).toLocaleTimeString()}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button className="px-4 py-2 bg-red-500 text-dark font-black text-[10px] uppercase rounded-xl hover:scale-105 transition-transform">Verify Incident</button>
                                                    </div>
                                                </motion.div>
                                            ))
                                        )}
                                    </div>

                                    <div className="col-span-4 space-y-8">
                                        <div className="glass-card p-6 border-white/5 bg-primary/5 border-primary/20">
                                            <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-4 italic">Security Guidelines</h3>
                                            <ul className="space-y-4">
                                                {[
                                                    { icon: Lock, text: 'Enable MFA for large transactions', color: 'text-amber-500' },
                                                    { icon: Shield, text: 'Monitor biometric drift monthly', color: 'text-indigo-400' },
                                                    { icon: Activity, text: 'Real-time incident response active', color: 'text-green-500' }
                                                ].map((item, i) => (
                                                    <li key={i} className="flex gap-3 text-xs text-gray-400 leading-relaxed italic">
                                                        <item.icon size={14} className={item.color} />
                                                        {item.text}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                </motion.div>
            </main>
        </div>
    );
};

// Internal Helper for Admin Icon (prevents import confusion)
const AdminUserIcon = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04M12 2.944V21m0-18.056L3.382 7.016M12 21.056l8.618-4.04M12 2.944l8.618 4.072M12 21.056L3.382 17.016" />
    </svg>
);

export default AdminDashboard;
