import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

const PaymentTable = ({ payments }) => (
    <div className="glass-card p-6">
        <h3 className="text-xl font-bold mb-6">Recent Transactions</h3>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="text-gray-400 border-b border-white/10">
                        <th className="pb-4 font-medium">User</th>
                        <th className="pb-4 font-medium">Amount</th>
                        <th className="pb-4 font-medium">Biometric</th>
                        <th className="pb-4 font-medium">Status</th>
                        <th className="pb-4 font-medium">Time</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {payments?.map((payment, index) => (
                        <motion.tr
                            key={index}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className="group hover:bg-white/5 transition-colors"
                        >
                            <td className="py-4 font-medium text-gray-300">{payment.email}</td>
                            <td className="py-4 font-bold text-white">₹{payment.amount}</td>
                            <td className="py-4">
                                {payment.biometric_verified ? (
                                    <span className="flex items-center gap-1.5 text-green-400 text-sm font-semibold px-3 py-1 bg-green-400/10 rounded-full w-fit">
                                        <CheckCircle2 size={14} /> Verified
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1.5 text-red-400 text-sm font-semibold px-3 py-1 bg-red-400/10 rounded-full w-fit">
                                        <XCircle size={14} /> Failed
                                    </span>
                                )}
                            </td>
                            <td className="py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${payment.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                                        payment.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                                            'bg-yellow-500/10 text-yellow-400'
                                    }`}>
                                    {payment.status}
                                </span>
                            </td>
                            <td className="py-4 text-gray-500 text-sm">
                                {new Date(payment.timestamp).toLocaleTimeString()}
                            </td>
                        </motion.tr>
                    ))}
                </tbody>
            </table>
            {(!payments || payments.length === 0) && (
                <div className="text-center py-12 text-gray-500">
                    No payment records found
                </div>
            )}
        </div>
    </div>
);

export default PaymentTable;
