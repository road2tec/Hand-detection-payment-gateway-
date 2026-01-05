import { motion } from 'framer-motion';
import { Shield, Fingerprint, CreditCard, ArrowRight, Activity, Lock, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { containerVariants, buttonVariants } from '../animations/motionVariants';

const Landing = () => {
    const features = [
        {
            icon: <Fingerprint className="w-8 h-8 text-primary" />,
            title: "Hand Geometry",
            description: "Advanced biometric extraction using 21 key hand landmarks for precise identification."
        },
        {
            icon: <Shield className="w-8 h-8 text-secondary" />,
            title: "Zero-Knowledge Storage",
            description: "We never store raw images. Only encrypted geometric feature vectors are kept."
        },
        {
            icon: <CreditCard className="w-8 h-8 text-accent" />,
            title: "Biometric Payments",
            description: "Your hand is your card. Secure your transactions with a simple scan."
        }
    ];

    const stats = [
        { label: "Verification Time", value: "< 2s" },
        { label: "Accuracy", value: "99.9%" },
        { label: "Secure Protocols", value: "AES-256" }
    ];

    return (
        <div className="min-h-screen overflow-hidden">
            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-6">
                <div className="container mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <span className="inline-block py-1 px-4 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6 border border-primary/20">
                            The Future of Payment Authentication
                        </span>
                        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                            Secure Payments at <br />
                            <span className="text-gradient">Your Fingertips</span>
                        </h1>
                        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                            Experience the next generation of financial security. Our system uses advanced hand geometry biometrics to ensure only you can authorize your payments.
                        </p>

                        <div className="flex flex-wrap justify-center gap-6">
                            <Link to="/register">
                                <motion.button
                                    variants={buttonVariants}
                                    whileHover="hover"
                                    whileTap="tap"
                                    className="gradient-button px-8 py-4 text-lg font-bold flex items-center gap-2"
                                >
                                    Get Started Now <ArrowRight className="w-5 h-5" />
                                </motion.button>
                            </Link>
                            <Link to="/login">
                                <motion.button
                                    variants={buttonVariants}
                                    whileHover="hover"
                                    whileTap="tap"
                                    className="bg-white/5 hover:bg-white/10 text-white px-8 py-4 rounded-xl text-lg font-bold border border-white/10 backdrop-blur-md transition-all"
                                >
                                    Log In
                                </motion.button>
                            </Link>
                        </div>
                    </motion.div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] -z-10 animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[120px] -z-10" />
            </section>

            {/* Features Section */}
            <section className="py-20 px-6 bg-black/40 backdrop-blur-xl border-y border-white/5">
                <div className="container mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.2 }}
                                className="glass-card p-8 hover:border-primary/30 transition-all group"
                            >
                                <div className="mb-6 p-4 rounded-2xl bg-white/5 w-fit group-hover:scale-110 transition-transform">
                                    {feature.icon}
                                </div>
                                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Live Stats Display (Visual Placeholder for Hero Context) */}
            <section className="py-20 px-6">
                <div className="container mx-auto">
                    <div className="glass-card p-12 relative overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                            {stats.map((stat, index) => (
                                <div key={index} className="relative z-10">
                                    <p className="text-gray-400 text-sm font-medium mb-2 uppercase tracking-wider">{stat.label}</p>
                                    <p className="text-4xl font-bold text-gradient">{stat.value}</p>
                                </div>
                            ))}
                        </div>
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Activity className="w-32 h-32 text-primary" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Workflow Section */}
            <section className="py-20 px-6 bg-gradient-to-b from-transparent to-primary/5">
                <div className="container mx-auto text-center mb-16">
                    <h2 className="text-4xl font-bold mb-4">How it Works</h2>
                    <p className="text-gray-400 max-w-xl mx-auto">Three simple steps to biometric freedom.</p>
                </div>

                <div className="container mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                        {[
                            { step: "01", icon: <Smartphone />, title: "Enroll", desc: "Register your details and take 3 hand captures." },
                            { step: "02", icon: <Lock />, title: "Verify", desc: "Our AI extracts unique geometric features." },
                            { step: "03", icon: <Shield />, title: "Secure", desc: "Complete payments with a single hand scan." }
                        ].map((item, idx) => (
                            <div key={idx} className="flex-1 text-center relative">
                                <div className="text-6xl font-black text-white/5 absolute -top-10 left-1/2 -translate-x-1/2 -z-10">{item.step}</div>
                                <div className="mb-6 mx-auto p-6 rounded-full bg-primary/10 w-fit text-primary border border-primary/20">
                                    {item.icon}
                                </div>
                                <h4 className="text-xl font-bold mb-2">{item.title}</h4>
                                <p className="text-gray-500">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer-like CTA */}
            <section className="py-20 px-6 text-center border-t border-white/10">
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="glass-card p-16 max-w-4xl mx-auto bg-gradient-to-br from-primary/20 to-secondary/20 border-primary/30"
                >
                    <h2 className="text-4xl font-bold mb-8 italic">Ready to transform your security?</h2>
                    <Link to="/register">
                        <button className="gradient-button px-12 py-5 text-xl font-black rounded-2xl shadow-[0_0_50px_-12px_rgba(16,185,129,0.5)]">
                            Start Enrollment
                        </button>
                    </Link>
                </motion.div>
            </section>
        </div>
    );
};

export default Landing;
