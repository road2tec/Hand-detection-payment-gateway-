import { useState } from 'react';
import { motion } from 'framer-motion';
import { Fingerprint, ShieldCheck, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { biometricService } from '../services/api';
import AutoHandCapture from '../components/AutoHandCapture';
import Loader from '../components/Loader';

const UpdateBiometrics = () => {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleUpdate = async (images) => {
        setLoading(true);
        setError(null);
        try {
            const formData = new FormData();
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

            images.forEach((img, index) => {
                formData.append('images', decodeBase64Image(img), `hand_${index}.jpg`);
            });

            await biometricService.registerHand(formData);
            setSuccess(true);
            setTimeout(() => navigate('/dashboard'), 2000);
        } catch (err) {
            console.error("Biometric Update Error:", err);
            setError(err.response?.data?.detail || "Update failed. Please ensure hand is clear and try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen pt-32 px-6 pb-20 flex items-center justify-center bg-dark relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 blur-[150px] -z-10 rounded-full" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-2xl glass-card p-10 border-primary/20 shadow-primary/5"
            >
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/40 shadow-lg shadow-primary/20">
                        <Fingerprint className="text-primary w-10 h-10" />
                    </div>
                    <h1 className="text-4xl font-black mb-2 tracking-tight">Security Upgrade</h1>
                    <p className="text-gray-400 font-medium">Calibrating your high-fidelity biometric profile (V7)</p>
                </div>

                {success ? (
                    <div className="text-center py-10">
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                            <ShieldCheck className="w-20 h-20 text-green-400 mx-auto mb-4" />
                        </motion.div>
                        <h2 className="text-2xl font-bold mb-2">Signature Verified</h2>
                        <p className="text-gray-400">Your account is now protected by the latest 51D biometric engine.</p>
                        <p className="text-primary mt-4 font-black animate-pulse uppercase text-xs tracking-widest">Redirecting to Dashboard...</p>
                    </div>
                ) : loading ? (
                    <div className="flex flex-col items-center py-20 gap-4 text-center">
                        <Loader />
                        <p className="text-primary font-bold animate-pulse uppercase text-xs tracking-[0.3em]">Analyzing 51-Point Geometry...</p>
                        <p className="text-gray-500 text-sm italic">Synthesizing statistical variance profile</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        <div className="p-6 bg-primary/5 border border-primary/20 rounded-2xl">
                            <div className="flex gap-4 items-start">
                                <AlertCircle className="text-primary w-6 h-6 mt-1 flex-shrink-0" />
                                <div>
                                    <h3 className="text-white font-bold mb-1 uppercase text-xs tracking-wider">Mandatory Identity Binding</h3>
                                    <p className="text-sm text-gray-400 leading-relaxed">
                                        To achieve zero-trust security, we require 5 clean captures. This builds a robust mathematical profile that handles varying light and prevents impersonation.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <AutoHandCapture
                            requiredCount={5}
                            onCapture={handleUpdate}
                            title="Enroll Your 5 Signature Samples"
                        />

                        {error && (
                            <div className="p-4 bg-red-400/10 border border-red-400/20 rounded-xl text-center">
                                <p className="text-red-400 text-sm font-semibold">{error}</p>
                            </div>
                        )}

                        <button
                            onClick={() => navigate('/dashboard')}
                            className="w-full py-4 text-gray-500 hover:text-white transition-colors flex items-center justify-center gap-2 font-black uppercase text-[10px] tracking-widest border border-white/5 rounded-2xl"
                        >
                            Return to Safety
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default UpdateBiometrics;
