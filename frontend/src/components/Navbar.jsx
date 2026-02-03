import { useState, useEffect } from 'react';
import { Shield, LogOut, Wallet, User as UserIcon } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    const location = useLocation();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else {
            setUser(null);
        }
    }, [location.pathname]);

    const handleLogout = () => {
        localStorage.clear();
        setUser(null);
        navigate('/login');
    };

    if (location.pathname === '/admin') return null;

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-dark/50 backdrop-blur-lg border-b border-white/10">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2 text-2xl font-black text-white group">
                    <div className="p-2 bg-primary/10 rounded-xl group-hover:scale-110 transition-transform">
                        <Shield className="text-primary w-7 h-7" />
                    </div>
                    <span className="tracking-tighter italic">Biometric<span className="text-primary">Pay</span></span>
                </Link>

                <div className="flex items-center gap-6">
                    {user ? (
                        <>
                            {user?.is_admin ? (
                                <Link to="/admin" className="text-gray-300 hover:text-white transition-colors">Security Monitor</Link>
                            ) : (
                                <Link to="/dashboard" className="text-gray-300 hover:text-white transition-colors">Dashboard</Link>
                            )}
                            <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                                <UserIcon className="w-4 h-4 text-primary" />
                                <span className="text-sm font-medium">{user?.name || 'User'}</span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-red-400"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="text-gray-300 hover:text-white transition-colors">Login</Link>
                            <Link to="/register" className="gradient-button">Get Started</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
