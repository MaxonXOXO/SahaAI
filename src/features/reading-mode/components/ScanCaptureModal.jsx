import { useEffect, useRef, useState } from 'react';
import { X, Camera, Upload, AlertTriangle, Loader2 } from 'lucide-react';

/**
 * ScanCaptureModal Component
 * Laptop/Desktop fallback to open webcam for live image capture or manual upload.
 */
export default function ScanCaptureModal({ isOpen, onClose, onImageSelected }) {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const fileInputRef = useRef(null);

    const [isCameraLoading, setIsCameraLoading] = useState(false);
    const [cameraError, setCameraError] = useState(null);
    const [isStreamActive, setIsStreamActive] = useState(false);

    // Start webcam stream
    const startWebcam = async () => {
        setIsCameraLoading(true);
        setCameraError(null);
        setIsStreamActive(false);

        // Stop any active stream first
        stopWebcam();

        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 1280 }, height: { ideal: 720 } }
            });
            streamRef.current = mediaStream;
            setIsStreamActive(true);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error('Error accessing webcam:', err);
            setCameraError('Webcam access was denied or no camera device was found. You can still select an image file below.');
        } finally {
            setIsCameraLoading(false);
        }
    };

    // Stop webcam stream tracks
    const stopWebcam = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        setIsStreamActive(false);
    };

    // Trigger camera setup when modal opens
    useEffect(() => {
        if (isOpen) {
            startWebcam();
        }
        return () => {
            stopWebcam();
        };
    }, [isOpen]);

    // Handle closing and cleanup
    const handleClose = () => {
        stopWebcam();
        onClose();
    };

    // Capture current video frame into canvas and produce Blob
    const handleCapture = () => {
        if (videoRef.current && isStreamActive) {
            const video = videoRef.current;
            const canvas = document.createElement('canvas');
            // Support natural video size or default fallback
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;

            const ctx = canvas.getContext('2d');
            if (ctx) {
                // Mirror the canvas draw if we mirrored the preview
                ctx.translate(canvas.width, 0);
                ctx.scale(-1, 1);
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                canvas.toBlob((blob) => {
                    if (blob) {
                        onImageSelected(blob);
                        handleClose();
                    }
                }, 'image/jpeg', 0.95);
            }
        }
    };

    // Handle manual upload file selection
    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            onImageSelected(file);
            handleClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={handleClose}
        >
            <div 
                className="bg-white dark:bg-gray-900 w-full max-w-md rounded-card p-6 shadow-2xl flex flex-col gap-4 animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                    <div className="flex items-center gap-2">
                        <Camera className="text-primary" size={20} />
                        <h3 className="text-base-md font-bold text-gray-900 dark:text-gray-100">Scan Document</h3>
                    </div>
                    <button 
                        onClick={handleClose}
                        className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                        aria-label="Close modal"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Webcam Preview Screen */}
                <div className="relative aspect-video w-full bg-gray-950 rounded-card overflow-hidden flex items-center justify-center border border-gray-200 dark:border-gray-800 shadow-inner">
                    {isCameraLoading && (
                        <div className="flex flex-col items-center gap-2 text-gray-400">
                            <Loader2 className="animate-spin text-primary" size={32} />
                            <p className="text-xs">Initializing webcam...</p>
                        </div>
                    )}

                    {cameraError ? (
                        <div className="p-4 text-center max-w-xs flex flex-col items-center gap-2">
                            <AlertTriangle className="text-accent-dyslexia" size={32} />
                            <p className="text-xs font-semibold text-gray-200">Webcam Not Available</p>
                            <p className="text-[11px] text-gray-400 leading-normal">{cameraError}</p>
                        </div>
                    ) : (
                        !isCameraLoading && (
                            <video 
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover scale-x-[-1]"
                            />
                        )
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                    {!cameraError && !isCameraLoading && (
                        <button
                            onClick={handleCapture}
                            disabled={!isStreamActive}
                            className="w-full min-h-touch py-3 rounded-card bg-primary hover:bg-primary-dark text-white font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Camera size={18} />
                            <span>Capture Photo</span>
                        </button>
                    )}

                    <div className="relative flex py-1 items-center">
                        <div className="flex-grow border-t border-gray-200 dark:border-gray-800"></div>
                        <span className="flex-shrink mx-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Or</span>
                        <div className="flex-grow border-t border-gray-200 dark:border-gray-800"></div>
                    </div>

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full min-h-touch py-3 rounded-card border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-primary dark:hover:border-primary text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary font-semibold flex items-center justify-center gap-2 transition-all bg-gray-50 dark:bg-gray-850 hover:bg-primary/5 dark:hover:bg-primary/10"
                    >
                        <Upload size={18} />
                        <span>Upload Image File</span>
                    </button>

                    <input 
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                    />
                </div>
            </div>
        </div>
    );
}
