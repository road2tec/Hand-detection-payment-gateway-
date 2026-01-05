import { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, RefreshCw, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const HandCapture = ({ onCapture, requiredCount = 1, title = "Capture Hand" }) => {
    const webcamRef = useRef(null);
    const [capturedImages, setCapturedImages] = useState([]);
    const [isCapturing, setIsCapturing] = useState(false);

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
            const newImages = [...capturedImages, imageSrc];
            setCapturedImages(newImages);

            if (newImages.length === requiredCount) {
                onCapture(newImages);
            }
        }
    }, [webcamRef, capturedImages, requiredCount, onCapture]);

    const reset = () => {
        setCapturedImages([]);
    };

    return (
        <div className="flex flex-col items-center gap-6">
            <h2 className="text-xl font-semibold">{title}</h2>

            <div className="relative w-full max-w-md aspect-video rounded-2xl overflow-hidden border-4 border-white/10 shadow-2xl">
                <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className="w-full h-full object-cover"
                />

                <div className="absolute inset-0 border-[20px] border-primary/20 pointer-events-none">
                    <div className="w-full h-full border-2 border-dashed border-white/50 opacity-50" />
                </div>

                <AnimatePresence>
                    {capturedImages.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute top-4 right-4 flex gap-2"
                        >
                            {capturedImages.map((_, i) => (
                                <div key={i} className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="flex gap-4">
                {capturedImages.length < requiredCount ? (
                    <button
                        onClick={capture}
                        className="gradient-button flex items-center gap-2"
                    >
                        <Camera className="w-5 h-5" />
                        Capture {capturedImages.length + 1} / {requiredCount}
                    </button>
                ) : (
                    <div className="flex items-center gap-2 text-green-400 font-semibold">
                        <CheckCircle2 className="w-6 h-6" />
                        <span>Capture Complete</span>
                    </div>
                )}

                <button
                    onClick={reset}
                    className="glass-button flex items-center gap-2 text-gray-400"
                >
                    <RefreshCw className="w-4 h-4" />
                    Reset
                </button>
            </div>

            <p className="text-sm text-gray-400 text-center max-w-xs">
                Position your hand clearly within the frame. Ensure good lighting and a plain background if possible.
            </p>
        </div>
    );
};

export default HandCapture;
