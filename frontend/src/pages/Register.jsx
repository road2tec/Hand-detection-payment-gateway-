import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, UserPlus, Fingerprint } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { authService, biometricService } from '../services/api';
import { containerVariants, buttonVariants } from '../animations/motionVariants';
import AutoHandCapture from '../components/AutoHandCapture';
import Loader from '../components/Loader';

const Register = () => {
    const [step, setStep] = useState(1); // 1: Info, 2: Biometrics
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleInfoSubmit = async (e) => {
        e.preventDefault();
        setStep(2);
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

    const handleHandCapture = async (images) => {
        setLoading(true);
        setError(null);
        try {
            console.log(`🚀 Starting registration for ${formData.email} with ${images.length} images.`);
            const signupData = new FormData();
            signupData.append('name', formData.name);
            signupData.append('email', formData.email);
            signupData.append('password', formData.password);

            images.forEach((img, index) => {
                const blob = decodeBase64Image(img);
                console.log(`📸 Image ${index} decoded. Size: ${blob.size} bytes`);
                signupData.append('images', blob, `hand_${index}.jpg`);
            });

            // Unified registration
            await authService.secureRegister(signupData);

            // Automatically Login to get token
            const loginResponse = await authService.login({
                username: formData.email,
                password: formData.password
            });

            const token = loginResponse.data.access_token;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(loginResponse.data.user));

            navigate('/dashboard');
        } catch (err) {
            console.error("Unified Registration Error:", err);
            setError(err.response?.data?.detail || "Registration failed. Please ensure hand is clear and try again.");
            setStep(1);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen pt-32 px-6 pb-20 flex items-center justify-center">
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="w-full max-w-2xl"
            >
                <div className="glass-card p-10">
                    <div className="text-center mb-10">
                        <h1 className="text-3xl font-bold mb-2">Create Account</h1>
                        <p className="text-gray-400">Join the future of secure payments</p>
                    </div>

                    <AnimatePresence mode="wait">
                        {step === 1 ? (
                            <motion.form
                                key="step1"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                onSubmit={handleInfoSubmit}
                                className="space-y-6"
                            >
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300 ml-1">Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                        <input
                                            type="text"
                                            required
                                            placeholder="John Doe"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300 ml-1">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                        <input
                                            type="email"
                                            required
                                            placeholder="name@example.com"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300 ml-1">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                        <input
                                            type="password"
                                            required
                                            placeholder="••••••••"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {error && <p className="text-red-400 text-sm text-center">{error}</p>}

                                <motion.button
                                    variants={buttonVariants}
                                    whileHover="hover"
                                    whileTap="tap"
                                    className="w-full gradient-button flex items-center justify-center gap-2"
                                >
                                    Continue to Biometrics
                                    <Fingerprint className="w-5 h-5" />
                                </motion.button>
                            </motion.form>
                        ) : (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                {loading ? (
                                    <div className="flex flex-col items-center py-20 gap-4">
                                        <Loader />
                                        <p className="text-primary font-medium">Securing Your Biometric Data...</p>
                                    </div>
                                ) : (
                                    <AutoHandCapture
                                        requiredCount={5}
                                        onCapture={handleHandCapture}
                                        title="Register Hand Biometrics"
                                    />
                                )}
                                <button
                                    onClick={() => setStep(1)}
                                    className="mt-8 text-gray-500 hover:text-white transition-colors flex items-center gap-2 mx-auto"
                                >
                                    Back to Details
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="mt-8 text-center text-gray-400">
                        Already have an account? {' '}
                        <Link to="/login" className="text-primary hover:underline font-medium">Log In</Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;
