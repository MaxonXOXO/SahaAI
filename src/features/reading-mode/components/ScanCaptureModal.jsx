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
    const activeRequestIdRef = useRef(0);
    const containerRef = useRef(null);
    const dragInfo = useRef({ type: null, startX: 0, startY: 0, startBox: null });

    const [isCameraLoading, setIsCameraLoading] = useState(false);
    const [cameraError, setCameraError] = useState(null);
    const [isStreamActive, setIsStreamActive] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const [isCropMode, setIsCropMode] = useState(false);
    const [cropBox, setCropBox] = useState({ x: 0.15, y: 0.15, w: 0.7, h: 0.7 });

    // Start webcam stream
    const startWebcam = async () => {
        setIsCameraLoading(true);
        setCameraError(null);
        setIsStreamActive(false);

        // Stop any active stream first
        stopWebcam();

        // Increment and capture request ID to track asynchronous state
        activeRequestIdRef.current += 1;
        const requestId = activeRequestIdRef.current;

        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 1280 }, height: { ideal: 720 } }
            });
            
            if (requestId !== activeRequestIdRef.current) {
                // Modal was closed or a newer request started before getUserMedia finished
                mediaStream.getTracks().forEach((track) => track.stop());
                return;
            }

            streamRef.current = mediaStream;
            setIsStreamActive(true);
        } catch (err) {
            if (requestId === activeRequestIdRef.current) {
                console.error('Error accessing webcam:', err);
                setCameraError('Webcam access was denied or no camera device was found. You can still select an image file below.');
            }
        } finally {
            if (requestId === activeRequestIdRef.current) {
                setIsCameraLoading(false);
            }
        }
    };

    // Stop webcam stream tracks
    const stopWebcam = () => {
        activeRequestIdRef.current += 1; // Invalidate any pending camera requests
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

    // Ensure the stream is assigned to the video element when stream is active and video mounts
    useEffect(() => {
        if (isStreamActive && streamRef.current && videoRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [isStreamActive, isCameraLoading, capturedImage]);

    // Handle closing and cleanup
    const handleClose = () => {
        stopWebcam();
        setCapturedImage(null);
        setIsCropMode(false);
        setCropBox({ x: 0.15, y: 0.15, w: 0.7, h: 0.7 });
        onClose();
    };

    // Capture current video frame into canvas and save it
    const handleCapture = () => {
        if (videoRef.current && isStreamActive) {
            const video = videoRef.current;
            const canvas = document.createElement('canvas');
            // Support natural video size or default fallback
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;

            const ctx = canvas.getContext('2d');
            if (ctx) {
                // Drawing is unmirrored matching our option (a) implementation
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
                setCapturedImage(dataUrl);
                
                // Stop webcam stream tracks during review
                stopWebcam();
            }
        }
    };

    // Resets state and restarts the camera preview
    const handleRetake = () => {
        setCapturedImage(null);
        setIsCropMode(false);
        setCropBox({ x: 0.15, y: 0.15, w: 0.7, h: 0.7 });
        startWebcam();
    };

    // Client-side crop via canvas and finalize photo selection
    const handleUsePhoto = () => {
        if (!capturedImage) return;

        if (!isCropMode) {
            // Proceed with full captured image
            fetch(capturedImage)
                .then((res) => res.blob())
                .then((blob) => {
                    onImageSelected(blob);
                    handleClose();
                })
                .catch((err) => {
                    console.error('Error fetching captured image blob:', err);
                });
            return;
        }

        // Perform client-side cropping
        const img = new Image();
        img.onload = () => {
            const cropCanvas = document.createElement('canvas');
            const cw = img.naturalWidth * cropBox.w;
            const ch = img.naturalHeight * cropBox.h;
            cropCanvas.width = cw;
            cropCanvas.height = ch;

            const ctx = cropCanvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(
                    img,
                    img.naturalWidth * cropBox.x,
                    img.naturalHeight * cropBox.y,
                    img.naturalWidth * cropBox.w,
                    img.naturalHeight * cropBox.h,
                    0,
                    0,
                    cw,
                    ch
                );
                
                cropCanvas.toBlob((blob) => {
                    if (blob) {
                        onImageSelected(blob);
                        handleClose();
                    }
                }, 'image/jpeg', 0.95);
            }
        };
        img.src = capturedImage;
    };

    // Handle crop frame drag interactions
    const handleDragStart = (e, type) => {
        e.preventDefault();
        e.stopPropagation();
        
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        dragInfo.current = {
            type,
            startX: clientX,
            startY: clientY,
            startBox: { ...cropBox }
        };

        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('mouseup', handleDragEnd);
        document.addEventListener('touchmove', handleDragMove, { passive: false });
        document.addEventListener('touchend', handleDragEnd);
    };

    const handleDragMove = (e) => {
        if (!dragInfo.current.type) return;
        if (e.cancelable) e.preventDefault();

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        
        const dx = (clientX - dragInfo.current.startX) / rect.width;
        const dy = (clientY - dragInfo.current.startY) / rect.height;

        const { type, startBox } = dragInfo.current;
        let newBox = { ...startBox };

        const minSize = 0.1; // Maintain a minimum size of 10%

        if (type === 'MOVE') {
            newBox.x = Math.max(0, Math.min(1 - startBox.w, startBox.x + dx));
            newBox.y = Math.max(0, Math.min(1 - startBox.h, startBox.y + dy));
        } else {
            if (type.includes('L')) {
                const newX = Math.max(0, Math.min(startBox.x + startBox.w - minSize, startBox.x + dx));
                newBox.w = startBox.x + startBox.w - newX;
                newBox.x = newX;
            }
            if (type.includes('R')) {
                newBox.w = Math.max(minSize, Math.min(1 - startBox.x, startBox.w + dx));
            }
            if (type.includes('T')) {
                const newY = Math.max(0, Math.min(startBox.y + startBox.h - minSize, startBox.y + dy));
                newBox.h = startBox.y + startBox.h - newY;
                newBox.y = newY;
            }
            if (type.includes('B')) {
                newBox.h = Math.max(minSize, Math.min(1 - startBox.y, startBox.h + dy));
            }
        }

        setCropBox(newBox);
    };

    const handleDragEnd = () => {
        dragInfo.current = { type: null, startX: 0, startY: 0, startBox: null };
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
        document.removeEventListener('touchmove', handleDragMove);
        document.removeEventListener('touchend', handleDragEnd);
    };

    // Clean up global listeners on unmount
    useEffect(() => {
        return () => {
            document.removeEventListener('mousemove', handleDragMove);
            document.removeEventListener('mouseup', handleDragEnd);
            document.removeEventListener('touchmove', handleDragMove);
            document.removeEventListener('touchend', handleDragEnd);
        };
    }, []);

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

                {/* Webcam Preview Screen / Review screen */}
                <div className="relative aspect-video w-full bg-gray-950 rounded-card overflow-hidden flex items-center justify-center border border-gray-200 dark:border-gray-800 shadow-inner">
                    {isCameraLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gray-950 text-gray-400 z-10">
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
                        /* Show captured image still if present, otherwise show live stream */
                        capturedImage ? (
                            <div className="absolute inset-0 w-full h-full select-none" ref={containerRef}>
                                <img 
                                    src={capturedImage} 
                                    alt="Captured still page" 
                                    className="w-full h-full object-cover"
                                />
                                {isCropMode && (
                                    <>
                                        {/* Semi-transparent masks around crop area */}
                                        <div 
                                            className="absolute bg-black/60 top-0 left-0 right-0 pointer-events-none"
                                            style={{ height: `${cropBox.y * 100}%` }}
                                        />
                                        <div 
                                            className="absolute bg-black/60 bottom-0 left-0 right-0 pointer-events-none"
                                            style={{ top: `${(cropBox.y + cropBox.h) * 100}%` }}
                                        />
                                        <div 
                                            className="absolute bg-black/60 left-0 pointer-events-none"
                                            style={{ 
                                                top: `${cropBox.y * 100}%`, 
                                                height: `${cropBox.h * 100}%`,
                                                width: `${cropBox.x * 100}%` 
                                            }}
                                        />
                                        <div 
                                            className="absolute bg-black/60 right-0 pointer-events-none"
                                            style={{ 
                                                top: `${cropBox.y * 100}%`, 
                                                height: `${cropBox.h * 100}%`,
                                                left: `${(cropBox.x + cropBox.w) * 100}%` 
                                            }}
                                        />

                                        {/* Draggable/Resizable Crop Box */}
                                        <div 
                                            className="absolute border-2 border-primary cursor-move flex items-center justify-center shadow-[0_0_0_1px_rgba(255,255,255,0.3)]"
                                            style={{
                                                left: `${cropBox.x * 100}%`,
                                                top: `${cropBox.y * 100}%`,
                                                width: `${cropBox.w * 100}%`,
                                                height: `${cropBox.h * 100}%`
                                            }}
                                            onMouseDown={(e) => handleDragStart(e, 'MOVE')}
                                            onTouchStart={(e) => handleDragStart(e, 'MOVE')}
                                        >
                                            {/* Four Corner Handles with comfortable touch area */}
                                            <div 
                                                className="absolute w-6 h-6 -top-3 -left-3 cursor-nwse-resize flex items-center justify-center z-20"
                                                onMouseDown={(e) => handleDragStart(e, 'TL')}
                                                onTouchStart={(e) => handleDragStart(e, 'TL')}
                                            >
                                                <div className="w-3.5 h-3.5 bg-primary border-2 border-white rounded-full shadow-md active:scale-125 transition-transform" />
                                            </div>
                                            <div 
                                                className="absolute w-6 h-6 -top-3 -right-3 cursor-nesw-resize flex items-center justify-center z-20"
                                                onMouseDown={(e) => handleDragStart(e, 'TR')}
                                                onTouchStart={(e) => handleDragStart(e, 'TR')}
                                            >
                                                <div className="w-3.5 h-3.5 bg-primary border-2 border-white rounded-full shadow-md active:scale-125 transition-transform" />
                                            </div>
                                            <div 
                                                className="absolute w-6 h-6 -bottom-3 -left-3 cursor-nesw-resize flex items-center justify-center z-20"
                                                onMouseDown={(e) => handleDragStart(e, 'BL')}
                                                onTouchStart={(e) => handleDragStart(e, 'BL')}
                                            >
                                                <div className="w-3.5 h-3.5 bg-primary border-2 border-white rounded-full shadow-md active:scale-125 transition-transform" />
                                            </div>
                                            <div 
                                                className="absolute w-6 h-6 -bottom-3 -right-3 cursor-nwse-resize flex items-center justify-center z-20"
                                                onMouseDown={(e) => handleDragStart(e, 'BR')}
                                                onTouchStart={(e) => handleDragStart(e, 'BR')}
                                            >
                                                <div className="w-3.5 h-3.5 bg-primary border-2 border-white rounded-full shadow-md active:scale-125 transition-transform" />
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <>
                                <video 
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover"
                                />
                                {/* Alignment Guide Overlay */}
                                {isStreamActive && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4">
                                        {/* 3:4 document guide box */}
                                        <div className="w-[60%] aspect-[3/4] border-2 border-dashed border-white/60 rounded shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] flex items-center justify-center relative">
                                            {/* Corners highlights */}
                                            <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-white -mt-[2px] -ml-[2px]" />
                                            <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 border-white -mt-[2px] -mr-[2px]" />
                                            <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 border-white -mb-[2px] -ml-[2px]" />
                                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-white -mb-[2px] -mr-[2px]" />
                                        </div>
                                        <p className="mt-4 text-[10px] font-bold tracking-wider text-white bg-black/60 px-3 py-1 rounded-full uppercase">
                                            Center your document within the frame
                                        </p>
                                    </div>
                                )}
                            </>
                        )
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                    {capturedImage ? (
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleUsePhoto}
                                className="w-full min-h-touch py-3 rounded-card bg-primary hover:bg-primary-dark text-white font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]"
                            >
                                <span>Use Photo</span>
                            </button>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleRetake}
                                    className="flex-1 min-h-touch py-3 rounded-card bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                                >
                                    <span>Retake</span>
                                </button>
                                <button
                                    onClick={() => setIsCropMode(!isCropMode)}
                                    className={`flex-1 min-h-touch py-3 rounded-card font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] border ${
                                        isCropMode 
                                            ? 'bg-primary/10 text-primary border-primary dark:bg-primary/20' 
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 border-transparent'
                                    }`}
                                >
                                    <span>{isCropMode ? 'Cancel Crop' : 'Crop'}</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
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
                        </>
                    )}

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
