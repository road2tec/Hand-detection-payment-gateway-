import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, CheckCircle2, Loader2, PlayCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hands } from '@mediapipe/hands';
import * as drawingUtils from '@mediapipe/drawing_utils';
import { Camera as MediaPipeCamera } from '@mediapipe/camera_utils';

const STABILITY_THRESHOLD = 0.005; // Maximum average movement allowed between frames
const CAPTURE_INTERVAL = 900; // ms between captures
const AutoHandCapture = ({ onCapture, requiredCount = 5, title = "Automatic Hand Capture", autoStart = false }) => {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const handsRef = useRef(null);
    const cameraRef = useRef(null);

    // State for capture logic
    const [capturedImages, setCapturedImages] = useState([]);
    const [isCapturing, setIsCapturing] = useState(false);
    const isCapturingRef = useRef(false);
    const [isModelLoading, setIsModelLoading] = useState(true);
    const [progress, setProgress] = useState(0);
    const [handDetected, setHandDetected] = useState(false);
    const [isStable, setIsStable] = useState(false);

    // Logic refs
    const lastLandmarks = useRef(null);
    const lastCaptureTime = useRef(0);
    const captureStream = useRef([]);

    // Initialize MediaPipe Hands
    useEffect(() => {
        const hands = new Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }
        });

        hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.7,
            minTrackingConfidence: 0.7
        });

        hands.onResults(onResults);
        handsRef.current = hands;
        setIsModelLoading(false);

        return () => {
            if (cameraRef.current) cameraRef.current.stop();
            if (handsRef.current) handsRef.current.close();
        };
    }, []);

    // Auto-start logic
    useEffect(() => {
        if (autoStart && !isModelLoading && webcamRef.current?.video) {
            // Small delay to ensure webcam stream is active
            const timer = setTimeout(() => {
                startCapture();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [autoStart, isModelLoading]);

    const calculateMovement = (currentLandmarks) => {
        if (!lastLandmarks.current) return 1.0;

        let totalDist = 0;
        for (let i = 0; i < 21; i++) {
            const dx = currentLandmarks[i].x - lastLandmarks.current[i].x;
            const dy = currentLandmarks[i].y - lastLandmarks.current[i].y;
            totalDist += Math.sqrt(dx * dx + dy * dy);
        }
        return totalDist / 21;
    };

    const onResults = useCallback((results) => {
        if (!canvasRef.current || !webcamRef.current?.video) return;

        const canvasCtx = canvasRef.current.getContext('2d');
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        let detected = false;
        let stable = false;

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            detected = true;
            const landmarks = results.multiHandLandmarks[0];

            // Draw landmarks
            drawingUtils.drawConnectors(canvasCtx, landmarks, drawingUtils.HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 5 });
            drawingUtils.drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 2 });

            // Check stability
            const movement = calculateMovement(landmarks);
            stable = movement < STABILITY_THRESHOLD;
            lastLandmarks.current = landmarks;

            // Auto-capture logic
            const now = Date.now();
            if (isCapturingRef.current && stable && (now - lastCaptureTime.current > CAPTURE_INTERVAL) && captureStream.current.length < requiredCount) {
                console.log("📸 Automated Capture Triggered:", captureStream.current.length + 1);
                const imageSrc = webcamRef.current.getScreenshot();
                if (imageSrc) {
                    captureStream.current.push(imageSrc);
                    setCapturedImages([...captureStream.current]);
                    setProgress(captureStream.current.length);
                    lastCaptureTime.current = now;

                    if (captureStream.current.length === requiredCount) {
                        finishCapture();
                    }
                }
            }
        } else {
            lastLandmarks.current = null;
        }

        setHandDetected(detected);
        setIsStable(stable);
        canvasCtx.restore();
    }, []);

    const startCapture = () => {
        if (!webcamRef.current?.video) return;

        setIsCapturing(true);
        isCapturingRef.current = true;
        setCapturedImages([]);
        captureStream.current = [];
        setProgress(0);

        if (!cameraRef.current) {
            cameraRef.current = new MediaPipeCamera(webcamRef.current.video, {
                onFrame: async () => {
                    await handsRef.current.send({ image: webcamRef.current.video });
                },
                width: 640,
                height: 480
            });
            cameraRef.current.start();
        }
    };

    const finishCapture = () => {
        setIsCapturing(false);
        isCapturingRef.current = false;
        if (cameraRef.current) {
            cameraRef.current.stop();
            cameraRef.current = null;
        }
        onCapture(captureStream.current);
    };

    return (
        <div className="flex flex-col items-center gap-6 w-full max-w-2xl mx-auto p-4">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-white">{title}</h2>
                <p className="text-gray-400 text-sm">Hold your hand still within the frame for automatic capture.</p>
            </div>

            <div className="relative w-full aspect-video rounded-3xl overflow-hidden border-4 border-white/10 shadow-2xl bg-black">
                {/* Webcam Preview */}
                <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    screenshotQuality={1}
                    videoConstraints={{ width: 1280, height: 720, facingMode: "user" }}
                    className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Landmarks Canvas */}
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full object-cover z-10"
                    width={640}
                    height={480}
                />

                {/* Overlays */}
                <div className="absolute inset-0 z-20 pointer-events-none flex flex-col items-center justify-between p-6">
                    {/* Top Status */}
                    <div className="w-full flex justify-between items-start">
                        <div className={`px-4 py-2 rounded-full border backdrop-blur-md transition-all ${handDetected ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-white/5 border-white/10 text-white/50'}`}>
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                                <div className={`w-2 h-2 rounded-full ${handDetected ? 'bg-green-400 animate-pulse' : 'bg-white/30'}`} />
                                {handDetected ? 'Hand Detected' : 'Scanning...'}
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                            <div className={`px-4 py-2 rounded-full border backdrop-blur-md transition-all ${isStable ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-white/5 border-white/10 text-white/50'}`}>
                                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                                    {isStable ? 'Hand Stable' : 'Hold Still'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full max-w-xs space-y-3">
                        <div className="flex justify-between text-xs font-bold text-white/70 uppercase tracking-widest">
                            <span>Capturing Progress</span>
                            <span>{progress} / {requiredCount}</span>
                        </div>
                        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden border border-white/10">
                            <motion.div
                                className="h-full bg-gradient-to-r from-primary to-secondary"
                                initial={{ width: 0 }}
                                animate={{ width: `${(progress / requiredCount) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                <AnimatePresence>
                    {isModelLoading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center gap-4"
                        >
                            <Loader2 className="w-10 h-10 text-primary animate-spin" />
                            <p className="text-white font-medium">Initializing AI Engine...</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Actions */}
            <div className="w-full flex justify-center pt-4">
                {(!isCapturing && progress === 0) ? (
                    !autoStart ? (
                        <button
                            onClick={startCapture}
                            disabled={isModelLoading}
                            className="group relative px-8 py-4 bg-primary text-white font-black rounded-2xl flex items-center gap-3 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                        >
                            <PlayCircle className="w-6 h-6" />
                            START HAND CAPTURE
                            <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                    ) : (
                        <div className="flex items-center gap-3 px-8 py-4 bg-white/5 rounded-2xl border border-white/10">
                            <Loader2 className="w-6 h-6 text-primary animate-spin" />
                            <span className="font-bold text-white italic tracking-tighter uppercase">
                                Initializing Camera...
                            </span>
                        </div>
                    )
                ) : (
                    <div className="flex items-center gap-3 px-8 py-4 bg-white/5 rounded-2xl border border-white/10">
                        {progress < requiredCount ? (
                            <>
                                <Loader2 className="w-6 h-6 text-primary animate-spin" />
                                <span className="font-bold text-white italic tracking-tighter">
                                    AUTO-CAPTURING...
                                </span>
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-6 h-6 text-green-400" />
                                <span className="font-bold text-green-400">CAPTURE COMPLETE</span>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Thumbnail Preview */}
            <div className="flex gap-3 justify-center">
                {Array.from({ length: requiredCount }).map((_, i) => (
                    <div
                        key={i}
                        className={`w-12 h-12 rounded-xl border-2 transition-all overflow-hidden ${i < progress ? 'border-primary' : 'border-white/5 bg-white/5'}`}
                    >
                        {capturedImages[i] && (
                            <img src={capturedImages[i]} className="w-full h-full object-cover" alt={`Capture ${i + 1}`} />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AutoHandCapture;
