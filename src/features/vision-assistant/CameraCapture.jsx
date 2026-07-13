import { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, RefreshCw, ZoomIn, ZoomOut, Play, Square } from 'lucide-react';
import Button from '../../shared/components/Button';

/**
 * CameraCapture - Component that hooks up the webcam stream
 * Features digital zooming (CSS transform scale for compatibility),
 * camera toggle (front/back), and image frame capturing.
 */
export default function CameraCapture({ onCapture, isProcessing, speakFeedback, playBeep }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    const [hasPermission, setHasPermission] = useState(null);
    const [facingMode, setFacingMode] = useState('environment'); // 'environment' (back) or 'user' (front)
    const [zoom, setZoom] = useState(1);
    const [isActive, setIsActive] = useState(true);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }, []);

    const startCamera = useCallback(async () => {
        stopCamera();
        setHasPermission(null);

        const constraints = {
            video: {
                facingMode: facingMode,
                width: { ideal: 1280 },
                height: { ideal: 720 },
            },
            audio: false,
        };

        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setHasPermission(true);
            speakFeedback("Camera active. Point at your target and tap Capture.");
        } catch (err) {
            console.error('Camera access error:', err);
            setHasPermission(false);
            speakFeedback("Camera permission denied or camera not found. Please enable it in browser settings.");
        }
    }, [facingMode, speakFeedback, stopCamera]);

    // Initial camera setup
    useEffect(() => {
        if (isActive) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => {
            stopCamera();
        };
    }, [isActive, startCamera, stopCamera]);

    const toggleCameraMode = () => {
        playBeep(660, 0.08);
        setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
    };

    const handleCapture = () => {
        playBeep(880, 0.15);
        if (!videoRef.current || !hasPermission || isProcessing) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;

        // Draw current video frame to canvas
        // To support digital zoom in the captured image as well, we apply canvas clipping/drawing
        if (zoom > 1) {
            const w = canvas.width / zoom;
            const h = canvas.height / zoom;
            const x = (canvas.width - w) / 2;
            const y = (canvas.height - h) / 2;
            context.drawImage(video, x, y, w, h, 0, 0, canvas.width, canvas.height);
        } else {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
        }

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        speakFeedback("Image captured. Analyzing, please hold still.");
        onCapture(dataUrl);
    };

    const handleZoomChange = (e) => {
        const val = parseFloat(e.target.value);
        setZoom(val);
        // Play small ticking click sound for low vision feedback
        playBeep(300 + val * 100, 0.02);
    };

    const toggleActive = () => {
        playBeep(520, 0.08);
        setIsActive((prev) => !prev);
        speakFeedback(isActive ? "Camera paused." : "Camera resuming.");
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Viewfinder Container */}
            <div className="relative aspect-[4/3] w-full bg-black rounded-card overflow-hidden border-4 border-gray-800 dark:border-gray-900 shadow-lg">
                {hasPermission === null && isActive && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
                        <p className="text-base-md font-semibold text-center">Loading camera stream...</p>
                    </div>
                )}

                {hasPermission === false && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400 p-6 text-center">
                        <Camera size={48} className="mb-2" />
                        <p className="text-base-md font-semibold">Camera Access Disabled</p>
                        <p className="text-base-sm text-gray-400 mt-1">
                            Please grant camera permissions to use live scan features.
                        </p>
                        <Button variant="secondary" className="mt-4 bg-white" onClick={startCamera}>
                            Retry Camera
                        </Button>
                    </div>
                )}

                {!isActive && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-6 text-center">
                        <Square size={48} className="mb-2 text-gray-600" />
                        <p className="text-base-md font-semibold">Camera Stream Paused</p>
                        <Button variant="primary" className="mt-4" onClick={toggleActive}>
                            Activate Camera
                        </Button>
                    </div>
                )}

                {hasPermission && isActive && (
                    <>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover transition-transform duration-100"
                            style={{
                                transform: `scale(${zoom})`,
                                transformOrigin: 'center center',
                            }}
                        />

                        {/* High contrast center crosshair / guidelines */}
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                            <div className="w-48 h-48 border-2 border-white/40 border-dashed rounded-lg flex items-center justify-center">
                                <div className="w-4 h-4 border-t-2 border-l-2 border-white"></div>
                                <div className="w-4 h-4 border-t-2 border-r-2 border-white absolute top-20 right-20"></div>
                                <div className="w-4 h-4 border-b-2 border-l-2 border-white absolute bottom-20 left-20"></div>
                                <div className="w-4 h-4 border-b-2 border-r-2 border-white absolute bottom-20 right-20"></div>
                            </div>
                        </div>

                        {/* Top bar controls */}
                        <div className="absolute top-2 right-2 flex gap-2">
                            <button
                                onClick={toggleCameraMode}
                                aria-label="Switch Camera Front or Back"
                                className="w-12 h-12 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white border-2 border-white"
                            >
                                <RefreshCw size={22} />
                            </button>
                            <button
                                onClick={toggleActive}
                                aria-label="Pause Camera Feed"
                                className="w-12 h-12 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white border-2 border-white"
                            >
                                <Play size={22} />
                            </button>
                        </div>

                        {/* Loading overlay during analysis */}
                        {isProcessing && (
                            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white">
                                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                                <p className="text-base-lg font-bold">AI Analyzing Image...</p>
                                <p className="text-base-sm text-gray-300">Reading details out loud shortly</p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Magnifier / Digital Zoom Controls */}
            {hasPermission && isActive && (
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-card flex flex-col gap-2">
                    <label htmlFor="camera-zoom" className="flex items-center justify-between text-base-md font-bold text-gray-800 dark:text-gray-100">
                        <span className="flex items-center gap-2">
                            <ZoomIn size={20} className="text-primary" />
                            Digital Magnifier
                        </span>
                        <span className="text-primary bg-primary/10 px-2 py-0.5 rounded-full text-base-sm">
                            {zoom.toFixed(1)}x
                        </span>
                    </label>
                    <div className="flex items-center gap-3">
                        <ZoomOut size={18} className="text-gray-500" />
                        <input
                            id="camera-zoom"
                            type="range"
                            min="1"
                            max="4"
                            step="0.2"
                            value={zoom}
                            onChange={handleZoomChange}
                            className="flex-1 h-3 bg-gray-300 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                        <ZoomIn size={18} className="text-gray-500" />
                    </div>
                </div>
            )}

            {/* Giant High Contrast Capture Button */}
            {hasPermission && isActive && (
                <button
                    onClick={handleCapture}
                    disabled={isProcessing}
                    className="w-full min-h-touch bg-primary hover:bg-primary-dark disabled:bg-gray-400 text-white rounded-card flex items-center justify-center gap-3 font-bold text-base-lg py-4 shadow-md transition-colors border-2 border-white focus:ring-4 focus:ring-primary/50"
                >
                    <Camera size={26} />
                    Capture & Read Aloud
                </button>
            )}

            {/* Hidden canvas for snapshotting */}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}
