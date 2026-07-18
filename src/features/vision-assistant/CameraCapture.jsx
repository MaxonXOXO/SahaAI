import { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, RefreshCw, Play, Square } from 'lucide-react';
import Button from '../../shared/components/Button';

/**
 * CameraCapture - Component that hooks up the webcam stream
 * Features digital zooming (CSS transform scale for compatibility & pinch-to-zoom gesture),
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

    // Touch Pinch-to-Zoom Refs
    const initialPinchDistRef = useRef(null);
    const initialZoomRef = useRef(1);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            if (streamRef.current._mockInterval) {
                clearInterval(streamRef.current._mockInterval);
            }
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }, []);

    const startCamera = useCallback(async () => {
        if (playBeep) playBeep(440, 0.08);
        stopCamera();
        setHasPermission(null);

        // Check for mock camera parameter first
        const isMockCamera = window.location.search.includes('mock_camera');
        if (isMockCamera) {
            const canvasMock = document.createElement('canvas');
            canvasMock.width = 640;
            canvasMock.height = 480;
            const ctxMock = canvasMock.getContext('2d');
            let angle = 0;
            const interval = setInterval(() => {
                if (!ctxMock) return;
                ctxMock.fillStyle = '#1e293b';
                ctxMock.fillRect(0, 0, 640, 480);
                
                // Draw a pulsing circle
                ctxMock.strokeStyle = '#3b82f6';
                ctxMock.lineWidth = 4;
                ctxMock.beginPath();
                ctxMock.arc(320, 240, 80 + Math.sin(angle) * 20, 0, 2 * Math.PI);
                ctxMock.stroke();
                
                ctxMock.fillStyle = '#ffffff';
                ctxMock.font = '24px sans-serif';
                ctxMock.textAlign = 'center';
                ctxMock.fillText('Simulated Camera Viewfinder Feed', 320, 240);
                
                // Add a dynamic timestamp to ensure base64 checksum changes
                ctxMock.fillStyle = '#64748b';
                ctxMock.font = '16px sans-serif';
                ctxMock.fillText(`Frame Time: ${Date.now()}`, 320, 280);
                
                angle += 0.1;
            }, 100);

            const mockStream = canvasMock.captureStream(10);
            mockStream._mockInterval = interval;
            streamRef.current = mockStream;
            if (videoRef.current) {
                videoRef.current.srcObject = mockStream;
            }
            setHasPermission(true);
            speakFeedback("Camera active. Point at your target and tap Capture.");
            return;
        }

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
    }, [facingMode, speakFeedback, stopCamera, playBeep]);

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

    const toggleActive = () => {
        playBeep(520, 0.08);
        setIsActive((prev) => !prev);
        speakFeedback(isActive ? "Camera paused." : "Camera resuming.");
    };

    // Touch Pinch-to-Zoom Gesture Handlers
    const handleTouchStart = (e) => {
        if (e.touches.length === 2) {
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            initialPinchDistRef.current = dist;
            initialZoomRef.current = zoom;
        }
    };

    const handleTouchMove = (e) => {
        if (e.touches.length === 2 && initialPinchDistRef.current) {
            const currentDist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            if (initialPinchDistRef.current > 0) {
                const scaleFactor = currentDist / initialPinchDistRef.current;
                const newZoom = Math.min(3, Math.max(1, initialZoomRef.current * scaleFactor));
                setZoom(newZoom);
            }
        }
    };

    const handleTouchEnd = () => {
        initialPinchDistRef.current = null;
    };

    return (
        <div className="w-full h-full">
            {/* Viewfinder Container with Pinch-to-Zoom gesture */}
            <div
                className="relative w-full h-full bg-black touch-none overflow-hidden"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
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
                                aria-label={isActive ? "Pause Camera Feed" : "Resume Camera Feed"}
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

            {/* Hidden capture button for parent trigger */}
            <button
                onClick={handleCapture}
                disabled={isProcessing}
                data-capture-btn="true"
                className="hidden"
                aria-hidden="true"
                tabIndex={-1}
            />

            {/* Hidden canvas for snapshotting */}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}
