import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Shield, CreditCard, AlertTriangle } from 'lucide-react';

const ActivityFeed = ({ activities }) => (
    <div className="glass-card p-6 h-full">
        <div className="flex items-center gap-3 mb-6">
            <Activity className="text-primary" />
            <h3 className="text-xl font-bold">Live Activity Feed</h3>
        </div>
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            <AnimatePresence mode="popLayout">
                {activities?.map((item, index) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
                    >
                        <div className={`p-2 rounded-xl mt-1 ${item.type === 'biometric'
                                ? item.status === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                : 'bg-primary/20 text-primary'
                            }`}>
                            {item.type === 'biometric' ? <Shield size={18} /> : <CreditCard size={18} />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-200 leading-relaxed font-medium">
                                {item.message}
                            </p>
                            <span className="text-xs text-gray-500 mt-1 block">
                                {new Date(item.timestamp).toLocaleTimeString()}
                            </span>
                        </div>
                    </motion.div>
                ))}
                {(!activities || activities.length === 0) && (
                    <div className="text-center py-12 text-gray-500">
                        No recent activity detected
                    </div>
                )}
            </AnimatePresence>
        </div>
    </div>
);

export default ActivityFeed;
