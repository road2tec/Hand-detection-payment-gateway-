import { motion } from 'framer-motion';

const Loader = () => {
    return (
        <div className="flex items-center justify-center space-x-2">
            {[0, 1, 2].map((i) => (
                <motion.div
                    key={i}
                    className="w-3 h-3 bg-primary rounded-full"
                    animate={{
                        scale: [1, 1.5, 1],
                        opacity: [1, 0.5, 1],
                    }}
                    transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: i * 0.2,
                    }}
                />
            ))}
        </div>
    );
};

export default Loader;
