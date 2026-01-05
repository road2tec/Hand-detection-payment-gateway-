import { motion } from 'framer-motion';
import { Users, ShieldCheck, CreditCard, AlertCircle, IndianRupee } from 'lucide-react';

const MetricCard = ({ title, value, icon: Icon, color, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="glass-card p-6 flex items-center gap-6"
    >
        <div className={`p-4 rounded-2xl bg-${color}/10 text-${color}`}>
            <Icon size={32} />
        </div>
        <div>
            <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-white tracking-tight">
                {typeof value === 'number' && title.includes('Amount') ? `₹${value.toLocaleString()}` : value}
            </h3>
        </div>
    </motion.div>
);

const MetricCards = ({ metrics }) => {
    const cards = [
        { title: 'Total Users', value: metrics?.totalUsers || 0, icon: Users, color: 'blue-400' },
        { title: 'Verifications Today', value: metrics?.verificationsToday || 0, icon: ShieldCheck, color: 'green-400' },
        { title: 'Successful Payments', value: metrics?.successfulPayments || 0, icon: CreditCard, color: 'primary' },
        { title: 'Total Amount', value: metrics?.totalAmount || 0, icon: IndianRupee, color: 'yellow-400' },
        { title: 'Failed Attempts', value: metrics?.failedAttempts || 0, icon: AlertCircle, color: 'red-400' },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            {cards.map((card, index) => (
                <MetricCard key={card.title} {...card} delay={index * 0.1} />
            ))}
        </div>
    );
};

export default MetricCards;
