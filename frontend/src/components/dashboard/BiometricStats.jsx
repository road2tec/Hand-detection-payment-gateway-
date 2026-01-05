import { motion } from 'framer-motion';
import { Target, BarChart3, TrendingUp, AlertTriangle } from 'lucide-react';

const BiometricStats = ({ stats }) => (
    <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-8">
            <BarChart3 className="text-primary" />
            <h3 className="text-xl font-bold">Biometric Analytics</h3>
        </div>

        <div className="space-y-8">
            <div className="flex justify-between items-end mb-2">
                <div>
                    <p className="text-gray-400 text-sm font-medium mb-1">Overall Accuracy</p>
                    <h4 className="text-4xl font-black text-white">{stats?.accuracy || 0}%</h4>
                </div>
                <div className={`flex items-center gap-1.5 text-sm font-bold ${(stats?.accuracy || 0) > 90 ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                    <TrendingUp size={16} /> Optimal Performance
                </div>
            </div>

            <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/10 p-0.5">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stats?.accuracy || 0}%` }}
                    className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-full shadow-[0_0_15px_rgba(30,174,152,0.4)]"
                />
            </div>

            <div className="grid grid-cols-2 gap-6 mt-8">
                <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20">
                    <p className="text-green-400 text-xs font-bold uppercase tracking-wider mb-2">Total Matches</p>
                    <div className="flex items-center gap-2">
                        <Target size={20} className="text-green-400" />
                        <span className="text-2xl font-bold text-white">{stats?.success || 0}</span>
                    </div>
                </div>
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                    <p className="text-red-400 text-xs font-bold uppercase tracking-wider mb-2">Mismatches</p>
                    <div className="flex items-center gap-2">
                        <AlertTriangle size={20} className="text-red-400" />
                        <span className="text-2xl font-bold text-white">{stats?.failed || 0}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

export default BiometricStats;
