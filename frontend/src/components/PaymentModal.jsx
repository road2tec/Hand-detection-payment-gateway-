import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import AutoHandCapture from './AutoHandCapture';
import { useState } from 'react';
import { biometricService, paymentService } from '../services/api';
import Loader from './Loader';
const PaymentModal = ({ isOpen, onClose, amount, onSuccess }) => {
    const [step, setStep] = useState('initial'); // initial, biometrics, verifying, otp, success, error
    const [error, setError] = useState(null);
    const [otp, setOtp] = useState('');
    const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
    const [lastImage, setLastImage] = useState(null);

    const handleStartVerificaton = () => {
        setStep('biometrics');
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
            setLastImage(images[0]);

            // Atomic Secure Gate: Verify Biometric AND Create Order in one request
            const orderRes = await paymentService.createOrder(formData);

            if (orderRes.data.otp_required) {
                setStep('otp');
                return;
            }

            const { order_id, key_id, currency } = orderRes.data;

            // Load Razorpay and Open Checkout
            const res = await loadRazorpayScript();
            if (!res) {
                setError("Razorpay SDK failed to load. Please check your internet connection.");
                setStep('error');
                return;
            }

            const options = {
                key: key_id,
                amount: orderRes.data.amount,
                currency: currency,
                name: "Secure Hand Payments",
                description: "Biometric Verified Transaction",
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
                            onClose();
                            setStep('initial');
                        }, 2000);
                    } catch (err) {
                        setError("Payment verification failed. Please contact support.");
                        setStep('error');
                    }
                },
                prefill: {
                    name: JSON.parse(localStorage.getItem('user'))?.name || "",
                    email: JSON.parse(localStorage.getItem('user'))?.email || "",
                },
                theme: { color: "#1eaf98" },
                modal: {
                    ondismiss: () => {
                        setStep('initial');
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (err) {
            console.error("Payment Flow Error:", err);
            const detail = err.response?.data?.detail;

            if (typeof detail === 'object' && detail !== null) {
                setError(detail.reason || detail.message || "Biometric validation failed.");
            } else {
                setError(detail || "An error occurred during the secure checkout process. Please ensure your hand is visible and try again.");
            }
            setStep('error');
        }
    };

    const handleOTPVerify = async (e) => {
        e.preventDefault();
        setIsVerifyingOTP(true);
        setError(null);
        try {
            await paymentService.verifyOTP({
                otp,
                amount
            });
            // After successful OTP verification, re-trigger capture complete with stored image
            if (lastImage) {
                handleCaptureComplete([lastImage]);
            }
        } catch (err) {
            setError(err.response?.data?.detail || "OTP verification failed.");
        } finally {
            setIsVerifyingOTP(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-dark/80 backdrop-blur-xl">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-2xl bg-dark-lighter border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
            >
                <div className="p-8">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-2xl font-bold flex items-center gap-3">
                            <CreditCard className="text-primary" />
                            Complete Payment
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex flex-col items-center py-10">
                        {step === 'initial' && (
                            <div className="text-center">
                                <div className="text-5xl font-bold mb-4">₹{amount}</div>
                                <p className="text-gray-400 mb-8">Secure biometric verification is required to proceed.</p>
                                <button onClick={handleStartVerificaton} className="gradient-button w-full sm:w-auto px-12">
                                    Verify & Pay
                                </button>
                            </div>
                        )}

                        {step === 'biometrics' && (
                            <AutoHandCapture
                                requiredCount={1}
                                autoStart={true}
                                onCapture={handleCaptureComplete}
                                title="Scan Hand to Verify"
                            />
                        )}

                        {step === 'verifying' && (
                            <div className="text-center">
                                <Loader />
                                <p className="mt-4 text-primary animate-pulse">Analyzing Biometric Features...</p>
                            </div>
                        )}

                        {step === 'otp' && (
                            <div className="text-center w-full max-w-sm px-4">
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="mb-8"
                                >
                                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/20">
                                        <ShieldCheck size={40} className="text-primary" />
                                    </div>
                                    <h3 className="text-2xl font-black mb-2 uppercase tracking-tighter italic">OTP Verification</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        A 6-digit code has been sent to your registered email to secure this high-value transaction.
                                    </p>
                                </motion.div>

                                <form onSubmit={handleOTPVerify} className="space-y-6">
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            maxLength="6"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                            placeholder="Enter 6-digit OTP"
                                            className="w-full bg-dark/50 border-2 border-white/5 rounded-2xl py-6 text-center text-3xl font-black tracking-[0.5em] text-primary focus:border-primary outline-none transition-all placeholder:text-dark-lighter placeholder:tracking-normal placeholder:text-lg"
                                            autoFocus
                                        />
                                        <div className="absolute inset-0 rounded-2xl bg-primary/5 -z-10 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                                    </div>

                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex items-center gap-2 text-red-500 bg-red-500/10 p-4 rounded-xl border border-red-500/20 text-sm font-bold"
                                        >
                                            <AlertCircle size={16} />
                                            {error}
                                        </motion.div>
                                    )}

                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            disabled={otp.length !== 6 || isVerifyingOTP}
                                            className="gradient-button w-full py-5 rounded-2xl shadow-2xl shadow-primary/20 flex items-center justify-center gap-3"
                                        >
                                            {isVerifyingOTP ? (
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <ShieldCheck size={20} />
                                            )}
                                            <span className="font-black uppercase tracking-wider">Confirm Transaction</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setStep('initial')}
                                            className="w-full mt-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
                                        >
                                            Cancel & Restart
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {step === 'payment' && (
                            <div className="text-center">
                                <Loader />
                                <p className="mt-4 text-primary animate-pulse">Processing Your Secure Payment...</p>
                            </div>
                        )}

                        {step === 'success' && (
                            <div className="text-center">
                                <CheckCircle2 className="w-20 h-20 text-green-400 mx-auto mb-4" />
                                <p className="text-2xl font-bold text-white">Payment Successful!</p>
                                <p className="text-gray-400 mt-2">Your biometric-secured transaction is complete.</p>
                            </div>
                        )}

                        {step === 'error' && (
                            <div className="text-center w-full">
                                {error?.toLowerCase()?.includes('mismatch') || error?.toLowerCase()?.includes('failed') ? (
                                    <div className="mb-6">
                                        <X size={80} className="text-red-500 mx-auto mb-4 border-4 border-red-500/20 rounded-full p-4" />
                                        <h3 className="text-3xl font-black text-red-500 uppercase tracking-tighter italic">Not Verified</h3>
                                    </div>
                                ) : (
                                    <AlertCircle className="w-16 h-16 text-warning-400 mx-auto mb-4" />
                                )}

                                <p className="text-lg font-medium text-gray-300 mb-8 max-w-md mx-auto">{error}</p>

                                <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
                                    <button onClick={() => setStep('initial')} className="gradient-button w-full py-4 rounded-2xl">
                                        Try Again
                                    </button>
                                    {error?.toLowerCase()?.includes('re-register') && (
                                        <button
                                            onClick={() => window.location.href = '/upgrade-biometrics'}
                                            className="w-full py-4 rounded-2xl bg-primary/20 border border-primary/40 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary/30 transition-all text-primary"
                                        >
                                            Go to Security Upgrade
                                        </button>
                                    )}
                                    <button onClick={onClose} className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all text-gray-500">
                                        Cancel Transaction
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default PaymentModal;
