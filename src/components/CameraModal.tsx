import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, AlertCircle, Sparkles, CheckSquare, Square } from 'lucide-react';
import { resizeImageToJpeg } from '../services/api';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (cleanDataUrl: string) => void;
  ageRange?: string;
}

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  ageRange,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasConsented, setHasConsented] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const isUnder18 = ageRange === 'under 18';

  // Check for multiple cameras
  useEffect(() => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');
      setHasMultipleCameras(videoInputs.length > 1);
    });
  }, []);

  // Start video stream when modal opens and user consented
  useEffect(() => {
    if (!isOpen || isUnder18 || !hasConsented) {
      stopStream();
      return;
    }

    let isMounted = true;
    setIsInitializing(true);
    setErrorMessage(null);

    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Camera access is not supported by your browser.');
        }

        const newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 1280 },
            height: { ideal: 960 },
          },
          audio: false,
        });

        if (isMounted) {
          setStream(newStream);
          if (videoRef.current) {
            videoRef.current.srcObject = newStream;
          }
          setIsInitializing(false);
        } else {
          newStream.getTracks().forEach((track) => track.stop());
        }
      } catch (err: any) {
        if (isMounted) {
          setIsInitializing(false);
          setErrorMessage(
            err.name === 'NotAllowedError'
              ? 'Camera permission was denied. Please allow camera access in browser permissions or continue without a photo.'
              : err.message || 'Unable to access your camera.'
          );
        }
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      stopStream();
    };
  }, [isOpen, facingMode, hasConsented, isUnder18]);

  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleCapture = async () => {
    if (!videoRef.current || isProcessing) return;
    setIsProcessing(true);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsProcessing(false);
      return;
    }

    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const rawDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    stopStream();

    // Re-encode to max 1024px longest side and strip EXIF
    const cleanJpeg = await resizeImageToJpeg(rawDataUrl);
    setIsProcessing(false);
    onCapture(cleanJpeg);
    onClose();
  };

  const toggleCamera = () => {
    stopStream();
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-stone-900 rounded-3xl overflow-hidden shadow-2xl border border-stone-800 text-stone-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-amber-400" />
            <span className="font-medium text-stone-200 text-sm">Face Scanner Camera</span>
          </div>
          <button
            onClick={() => {
              stopStream();
              onClose();
            }}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Under 18 check */}
        {isUnder18 ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-950/60 border border-amber-800 text-amber-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-stone-100 text-base">Photo Scanning Not Available</h3>
            <p className="text-xs text-stone-300 max-w-sm mx-auto leading-relaxed">
              Photo scanning is not available under 18. You can proceed with the quiz to receive
              gentle basic recommendations.
            </p>
            <button
              onClick={() => {
                stopStream();
                onClose();
              }}
              className="px-5 py-2 bg-stone-800 hover:bg-stone-700 text-xs font-semibold rounded-xl text-stone-200"
            >
              Continue to Quiz Only
            </button>
          </div>
        ) : !hasConsented ? (
          /* Consent Gate */
          <div className="p-6 sm:p-8 space-y-6">
            <div className="p-4 rounded-2xl bg-stone-800/80 border border-stone-700 space-y-3">
              <h3 className="text-sm font-bold text-amber-300">Privacy & Analysis Consent</h3>
              <p className="text-xs text-stone-300 leading-relaxed">
                Before activating your camera or uploading a picture, please review and accept our
                privacy notice:
              </p>

              <label className="flex items-start gap-3 p-3 rounded-xl bg-stone-900 border border-stone-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasConsented}
                  onChange={(e) => setHasConsented(e.target.checked)}
                  className="mt-0.5 rounded border-stone-600 accent-amber-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs text-stone-200 leading-snug">
                  I agree to send my photo to Google's Gemini AI to be analysed. This app does not
                  save it. Not available under 18.
                </span>
              </label>

              <ul className="text-[11px] text-stone-400 space-y-1 list-disc pl-4">
                <li>Your photo is held only in temporary browser memory and is never saved to a database.</li>
                <li>EXIF metadata is stripped and the image is downscaled to 1024px before transmission.</li>
                <li>The photo is optional; you can skip this and still receive catalog matches.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-stone-400 hover:text-stone-200"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!hasConsented}
                onClick={() => setHasConsented(true)}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl disabled:opacity-40 transition-colors"
              >
                Start Camera
              </button>
            </div>
          </div>
        ) : (
          /* Active Camera Viewport */
          <>
            <div className="relative aspect-4/3 bg-black flex items-center justify-center overflow-hidden">
              {isInitializing && (
                <div className="text-center p-6 space-y-2">
                  <RefreshCw className="w-8 h-8 mx-auto animate-spin text-amber-400" />
                  <p className="text-sm text-stone-400">Initializing camera feed...</p>
                </div>
              )}

              {errorMessage ? (
                <div className="text-center p-6 max-w-sm space-y-3">
                  <div className="w-12 h-12 rounded-full bg-red-950/60 border border-red-800 text-red-400 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <p className="text-sm text-stone-300 leading-relaxed">{errorMessage}</p>
                  <button
                    onClick={() => {
                      stopStream();
                      onClose();
                    }}
                    className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-xs font-medium rounded-lg text-stone-200"
                  >
                    Close & Continue Without Photo
                  </button>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${
                      facingMode === 'user' ? 'scale-x-[-1]' : ''
                    }`}
                  />

                  {/* Alignment guide */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-[62%] h-[78%] border-2 border-dashed border-amber-300/60 rounded-[50%]" />
                  </div>

                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-xs px-3 py-1 rounded-full text-[11px] text-amber-200 border border-amber-500/20">
                    Natural daylight, face camera without makeup
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-stone-900 border-t border-stone-800 flex items-center justify-between">
              <div>
                {hasMultipleCameras && !errorMessage && (
                  <button
                    type="button"
                    onClick={toggleCamera}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-stone-300 bg-stone-800 hover:bg-stone-700 rounded-lg"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Flip Camera</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    stopStream();
                    onClose();
                  }}
                  className="px-4 py-2 text-xs font-medium text-stone-400 hover:text-stone-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isInitializing || !!errorMessage || isProcessing}
                  onClick={handleCapture}
                  className="flex items-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs sm:text-sm rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isProcessing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                  <span>{isProcessing ? 'Processing...' : 'Take Photo'}</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
