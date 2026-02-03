import { motion, AnimatePresence } from 'framer-motion';
import {
    X, CreditCard, ShieldCheck, AlertCircle, CheckCircle2,
    User, Landmark, ArrowRight, ArrowLeft, Zap, Info
} from 'lucide-react';
import AutoHandCapture from './AutoHandCapture';
import { useState, useRef } from 'react';
import { biometricService, paymentService } from '../services/api';
import Loader from './Loader';

const PaymentModal = ({ isOpen, onClose, amount: initialAmount, onSuccess }) => {
    const [step, setStep] = useState('recipient'); // recipient, amount, summary, biometrics, verifying, otp, pin, success, error
    const [error, setError] = useState(null);
    const [recipient, setRecipient] = useState({ name: '', account: '', ifsc: '', bank: '' });
    const [amount, setAmount] = useState(initialAmount || '');
    const [otp, setOtp] = useState('');
    const [pin, setPin] = useState('');
    const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
    const [isVerifyingPIN, setIsVerifyingPIN] = useState(false);
    const lastImageRef = useRef(null);

    const resetWizard = () => {
        setStep('recipient');
        setRecipient({ name: '', account: '', ifsc: '', bank: '' });
        setAmount(initialAmount || '');
        setOtp('');
        setPin('');
        setError(null);
        lastImageRef.current = null;
    };

    const handleClose = () => {
        resetWizard();
        onClose();
    };

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const decodeBase64Image = (dataURI) => {
        const byteString = atob(dataURI.split(',')[1]);
        const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        return new Blob([ab], { type: mimeString });
    };

    const handleCaptureComplete = async (images) => {
        setStep('verifying');
        setError(null);
        try {
            const formData = new FormData();
            formData.append('image', decodeBase64Image(images[0]), 'hand.jpg');
            formData.append('amount', amount);
            formData.append('recipient_name', recipient.name);
            formData.append('account_number', recipient.account);
            formData.append('ifsc_code', recipient.ifsc);
            if (recipient.bank) formData.append('bank_name', recipient.bank);

            lastImageRef.current = images[0];

            const orderRes = await paymentService.createOrder(formData);

            if (orderRes.data.otp_required) {
                setStep('otp');
                return;
            }

            if (orderRes.data.pin_required) {
                setStep('pin');
                return;
            }

            const { order_id, key_id, currency } = orderRes.data;
            const res = await loadRazorpayScript();
            if (!res) {
                setError("Razorpay SDK failed to load.");
                setStep('error');
                return;
            }

            const options = {
                key: key_id,
                amount: orderRes.data.amount,
                currency: currency,
                name: "Secure Biometric Wallet",
                description: `Payment to ${recipient.name}`,
                order_id: order_id,
                handler: async (response) => {
                    setStep('verifying');
                    try {
                        await paymentService.verifyPayment({
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                            biometric_verified: true
                        });
                        setStep('success');
                        setTimeout(() => {
                            onSuccess();
                            handleClose();
                        }, 2000);
                    } catch (err) {
                        setError("Payment verification failed.");
                        setStep('error');
                    }
                },
                prefill: {
                    name: JSON.parse(localStorage.getItem('user'))?.name || "",
                    email: JSON.parse(localStorage.getItem('user'))?.email || "",
                },
                theme: { color: "#6366f1" },
                modal: { ondismiss: () => setStep('summary') }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            console.error("Payment Error:", err);
            const detail = err.response?.data?.detail;
            let errorMsg = "Checkout failed.";

            if (typeof detail === 'object') {
                errorMsg = detail.message || (Array.isArray(detail) ? JSON.stringify(detail) : "Checkout failed.");
                if (detail.reason) errorMsg += `: ${detail.reason}`;
            } else if (typeof detail === 'string') {
                errorMsg = detail;
            } else if (err.message) {
                errorMsg = `System Error: ${err.message}`;
            }

            setError(errorMsg);
            setStep('error');
        }
    };

    const handleOTPVerify = async (e) => {
        e.preventDefault();
        setIsVerifyingOTP(true);
        setError(null);
        try {
            await paymentService.verifyOTP({ otp, amount });
            if (lastImage) handleCaptureComplete([lastImage]);
        } catch (err) {
            setError(err.response?.data?.detail || "OTP verification failed.");
        } finally {
            setIsVerifyingOTP(false);
        }
    };

    const handlePINVerify = async (e) => {
        e.preventDefault();
        setIsVerifyingPIN(true);
        setError(null);
        try {
            await paymentService.verifyPIN({ pin, amount: parseFloat(amount) });
            // After PIN verified, proceed to create order
            if (lastImageRef.current) {
                await handleCaptureComplete([lastImageRef.current]);
            } else {
                setError("Biometric cache lost. Please retry.");
                setStep('error');
            }
        } catch (err) {
            setError(err.response?.data?.detail || "Invalid PIN");
        } finally {
            setIsVerifyingPIN(false);
        }
    };

    if (!isOpen) return null;

    const steps = [
        { id: 'recipient', label: 'Recipient' },
        { id: 'amount', label: 'Amount' },
        { id: 'summary', label: 'Review' },
        { id: 'biometrics', label: 'Verify' }
    ];

    const getActiveStepIndex = () => {
        const mainSteps = ['recipient', 'amount', 'summary'];
        const authSteps = ['biometrics', 'verifying', 'otp', 'pin'];
        if (mainSteps.includes(step)) return mainSteps.indexOf(step);
        if (authSteps.includes(step)) return 3;
        return 0;
    };

    const activeStepIndex = getActiveStepIndex();

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-dark/90 backdrop-blur-2xl">
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="w-full max-w-2xl bg-dark-darker border border-white/10 rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(99,102,241,0.2)]"
            >
                {/* Header with Progress Bar */}
                <div className="p-10 pb-0">
                    <div className="flex justify-between items-center mb-10">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/20 rounded-2xl">
                                <Zap className="text-primary w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black italic uppercase tracking-tighter">Secure Wizard</h2>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest opacity-60">Step {activeStepIndex + 1} of 4</p>
                            </div>
                        </div>
                        <button onClick={handleClose} className="p-4 hover:bg-white/5 rounded-full transition-all group">
                            <X className="w-6 h-6 text-gray-500 group-hover:text-white" />
                        </button>
                    </div>

                    <div className="flex gap-2 mb-10">
                        {steps.map((s, i) => (
                            <div key={s.id} className="h-1.5 flex-1 rounded-full bg-white/5 overflow-hidden">
                                <motion.div
                                    className="h-full bg-primary shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                                    initial={{ width: '0%' }}
                                    animate={{ width: activeStepIndex >= i ? '100%' : '0%' }}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-10 pt-0">
                    <AnimatePresence mode="wait">
                        {step === 'recipient' && (
                            <motion.div key="recipient" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Recipient Name</label>
                                    <div className="relative group">
                                        <User className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-primary transition-colors" size={20} />
                                        <input
                                            type="text"
                                            value={recipient.name}
                                            onChange={(e) => setRecipient({ ...recipient, name: e.target.value })}
                                            placeholder="John Doe"
                                            className="w-full bg-white/[0.03] border-2 border-white/5 rounded-[1.5rem] py-5 pl-14 pr-6 text-white font-bold outline-none focus:border-primary transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Account Number</label>
                                        <div className="relative group">
                                            <Landmark className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-primary transition-colors" size={20} />
                                            <input
                                                type="text"
                                                value={recipient.account}
                                                onChange={(e) => setRecipient({ ...recipient, account: e.target.value.replace(/\D/g, '') })}
                                                placeholder="0000 0000 0000"
                                                className="w-full bg-white/[0.03] border-2 border-white/5 rounded-[1.5rem] py-5 pl-14 pr-6 text-white font-mono font-bold outline-none focus:border-primary transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">IFSC Code</label>
                                        <input
                                            type="text"
                                            value={recipient.ifsc}
                                            onChange={(e) => setRecipient({ ...recipient, ifsc: e.target.value.toUpperCase() })}
                                            placeholder="SBIN0001234"
                                            className="w-full bg-white/[0.03] border-2 border-white/5 rounded-[1.5rem] py-5 px-6 text-white font-mono font-bold outline-none focus:border-primary transition-all"
                                        />
                                    </div>
                                </div>
                                <button
                                    disabled={!recipient.name || !recipient.account || !recipient.ifsc}
                                    onClick={() => setStep('amount')}
                                    className="w-full py-6 bg-primary text-dark font-black uppercase tracking-[0.2em] rounded-[1.5rem] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-98 transition-all disabled:opacity-30 flex items-center justify-center gap-3"
                                >
                                    Define Amount
                                    <ArrowRight size={20} />
                                </button>
                            </motion.div>
                        )}

                        {step === 'amount' && (
                            <motion.div key="amount" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10 py-10">
                                <div className="text-center space-y-4">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Transaction Value</label>
                                    <div className="relative flex justify-center items-center">
                                        <span className="text-5xl font-black text-gray-700 mr-2">₹</span>
                                        <input
                                            type="number"
                                            autoFocus
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="0.00"
                                            className="bg-transparent text-7xl font-black text-white outline-none border-none placeholder:text-gray-800 text-center w-full italic"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={() => setStep('recipient')} className="flex-1 py-6 bg-white/5 border border-white/10 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-3">
                                        <ArrowLeft size={16} />
                                        Back
                                    </button>
                                    <button
                                        disabled={!amount || parseFloat(amount) <= 0}
                                        onClick={() => setStep('summary')}
                                        className="flex-[2] py-6 bg-primary text-dark font-black uppercase tracking-widest rounded-[1.5rem] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-98 transition-all disabled:opacity-30"
                                    >
                                        Review Summary
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 'summary' && (
                            <motion.div key="summary" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                                <div className="glass-card p-10 bg-indigo-500/5 border-indigo-500/20 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl" />
                                    <div className="flex justify-between items-start mb-10">
                                        <div>
                                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2">Recipient Authority</p>
                                            <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white">{recipient.name}</h3>
                                        </div>
                                        <div className="p-4 bg-indigo-500/10 rounded-[1.5rem] border border-indigo-500/20">
                                            <Landmark className="text-indigo-400" size={24} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 opacity-60">Account Target</p>
                                            <p className="text-lg font-mono font-bold tracking-tighter text-white">
                                                ****{recipient.account.slice(-4)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 opacity-60">Security Level</p>
                                            <p className={`text-sm font-black uppercase italic ${parseFloat(amount) > 10000 ? 'text-amber-500' : 'text-primary'}`}>
                                                {parseFloat(amount) > 10000 ? 'Level: Maximum' : 'Level: Standard'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-10 pt-8 border-t border-white/5 flex justify-between items-center">
                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total Commitment</span>
                                        <span className="text-4xl font-black italic tracking-tighter text-primary">₹{amount}</span>
                                    </div>
                                </div>

                                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl flex items-center gap-4">
                                    <div className="p-2 bg-indigo-500/20 rounded-lg">
                                        <Info size={16} className="text-indigo-400" />
                                    </div>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase leading-tight tracking-wider">
                                        Authentication will be triggered via {parseFloat(amount) > 10000 ? 'Biometric + Multi-Factor OTP' : 'Palm Biometric Scan'}.
                                    </p>
                                </div>

                                <div className="flex gap-4">
                                    <button onClick={() => setStep('amount')} className="flex-1 py-6 bg-white/5 border border-white/10 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                                        Back
                                    </button>
                                    <button
                                        onClick={() => setStep('biometrics')}
                                        className="flex-[2] py-6 bg-primary text-dark font-black uppercase tracking-widest rounded-[1.5rem] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-98 transition-all flex items-center justify-center gap-3"
                                    >
                                        Initialize Biometrics
                                        <ArrowRight size={20} />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 'biometrics' && (
                            <motion.div key="biometrics" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                                <AutoHandCapture
                                    requiredCount={1}
                                    autoStart={true}
                                    onCapture={handleCaptureComplete}
                                    title="Scanning Neural Handprint"
                                />
                            </motion.div>
                        )}

                        {step === 'verifying' && (
                            <motion.div key="verifying" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center">
                                <Loader />
                                <p className="mt-10 text-[11px] font-black text-primary uppercase tracking-[0.5em] animate-pulse">Running Neural Consensus...</p>
                            </motion.div>
                        )}

                        {step === 'otp' && (
                            <motion.div key="otp" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-sm mx-auto py-10">
                                <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-10 border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                                    <ShieldCheck size={48} className="text-amber-500" />
                                </div>
                                <h3 className="text-3xl font-black mb-4 uppercase tracking-tighter italic">Dual Auth</h3>
                                <p className="text-gray-500 text-[11px] font-bold uppercase tracking-widest mb-10 leading-relaxed">
                                    Multi-factor 6-digit shield code sent to your verified node.
                                </p>
                                <form onSubmit={handleOTPVerify} className="space-y-8">
                                    <input
                                        type="text"
                                        maxLength="6"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                        placeholder="000000"
                                        className="w-full bg-white/[0.03] border-2 border-white/5 rounded-[2rem] py-8 text-center text-5xl font-black tracking-[0.5em] text-amber-500 focus:border-amber-500 outline-none transition-all"
                                        autoFocus
                                    />
                                    {error && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest">{error}</p>}
                                    <button
                                        type="submit"
                                        disabled={otp.length !== 6 || isVerifyingOTP}
                                        className="w-full py-6 bg-amber-500 text-dark font-black uppercase tracking-[0.2em] rounded-[2rem] shadow-xl shadow-amber-500/20 disabled:opacity-30"
                                    >
                                        {isVerifyingOTP ? 'Validating...' : 'Verify & Commit'}
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        {step === 'pin' && (
                            <motion.div key="pin" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-sm mx-auto py-10">
                                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-10 border border-primary/20 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                                    <ShieldCheck size={48} className="text-primary" />
                                </div>
                                <h3 className="text-3xl font-black mb-4 uppercase tracking-tighter italic">Secure PIN</h3>
                                <p className="text-gray-500 text-[11px] font-bold uppercase tracking-widest mb-10 leading-relaxed">
                                    Enter your secondary 6-digit security PIN to authorize this transaction.
                                </p>
                                <form onSubmit={handlePINVerify} className="space-y-8">
                                    <input
                                        type="password"
                                        maxLength="6"
                                        value={pin}
                                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                        placeholder="******"
                                        className="w-full bg-white/[0.03] border-2 border-white/5 rounded-[2rem] py-8 text-center text-5xl font-black tracking-[0.5em] text-primary focus:border-primary outline-none transition-all"
                                        autoFocus
                                    />
                                    {error && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest">{error}</p>}
                                    <button
                                        type="submit"
                                        disabled={pin.length !== 6 || isVerifyingPIN}
                                        className="w-full py-6 bg-primary text-dark font-black uppercase tracking-[0.2em] rounded-[2rem] shadow-xl shadow-primary/20 disabled:opacity-30"
                                    >
                                        {isVerifyingPIN ? 'Validating...' : 'Authorize Payment'}
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        {step === 'success' && (
                            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-20 text-center">
                                <div className="w-32 h-32 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-10 border border-green-500/20 shadow-[0_0_50px_rgba(34,197,94,0.3)]">
                                    <CheckCircle2 size={64} className="text-green-500" />
                                </div>
                                <h3 className="text-5xl font-black uppercase tracking-tighter italic mb-4">Secured!</h3>
                                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Transaction finalized on the secure node.</p>
                            </motion.div>
                        )}

                        {step === 'error' && (
                            <motion.div key="error" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-10 text-center">
                                <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-500/20">
                                    <X size={48} className="text-red-500" />
                                </div>
                                <h3 className="text-3xl font-black text-red-500 uppercase tracking-tighter italic mb-4">Protocol Error</h3>
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-10 max-w-xs mx-auto leading-loose">{error}</p>
                                <div className="space-y-4 max-w-xs mx-auto">
                                    <button onClick={() => setStep('summary')} className="w-full py-5 bg-white/5 border border-white/10 rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Retry Link</button>
                                    <button onClick={handleClose} className="w-full py-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 hover:text-white transition-all">Abort Transaction</button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default PaymentModal;
