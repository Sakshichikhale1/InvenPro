import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Barcode, Camera, RefreshCcw, AlertCircle, CheckCircle2, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { DecodeHintType, BarcodeFormat } from '@zxing/library';

const BarcodeScanner = ({ onScan }) => {
  const [barcode, setBarcode] = useState('');
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const codeReaderRef = useRef(null);
  const detectTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.QR_CODE,
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.ITF,
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);
    
    // Add visual feedback when it sees potential barcode points
    hints.set(DecodeHintType.NEED_RESULT_POINT_CALLBACK, (point) => {
      setDetecting(true);
      if (detectTimeoutRef.current) clearTimeout(detectTimeoutRef.current);
      detectTimeoutRef.current = setTimeout(() => setDetecting(false), 500);

      if (canvasRef.current && videoRef.current) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const ctx = canvas.getContext('2d');
        
        if (canvas.width !== video.videoWidth) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        ctx.fillStyle = 'rgba(0, 255, 100, 0.8)';
        ctx.beginPath();
        ctx.arc(point.getX(), point.getY(), 6, 0, 2 * Math.PI);
        ctx.fill();

        setTimeout(() => {
          ctx.clearRect(point.getX() - 8, point.getY() - 8, 16, 16);
        }, 300);
      }
    });

    codeReaderRef.current = new BrowserMultiFormatReader(hints);
    startScanning();

    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    setError('');
    setBarcode('');
    setIsScanning(true);
    
    try {
      const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
      if (videoInputDevices.length === 0) {
        throw new Error('No camera found');
      }

      // Prefer back camera on mobile
      const selectedDeviceId = videoInputDevices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear')
      )?.deviceId || videoInputDevices[0].deviceId;

      // Define higher quality constraints
      const constraints = {
        video: {
          deviceId: { exact: selectedDeviceId },
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 },
          facingMode: 'environment'
        }
      };

      // The reader is already initialized with TRY_HARDER hint in useEffect
      
      await codeReaderRef.current.decodeFromConstraints(
        constraints,
        videoRef.current,
        (result, err) => {
          if (result) {
            const detectedCode = result.getText();
            setBarcode(detectedCode);
            setIsScanning(false);
            stopScanning();
            toast.success(`Barcode detected: ${detectedCode}`);
            sendToBackend(detectedCode);
          }
          if (err && !(err.name === 'NotFoundException')) {
            console.debug('ZXing error:', err);
          }
        }
      );
    } catch (err) {
      console.error('Camera error:', err);
      setError(err.message || 'Failed to access camera');
      setIsScanning(false);
      toast.error('Camera access failed');
    }
  };

  const stopScanning = () => {
    if (codeReaderRef.current) {
      const stream = videoRef.current?.srcObject;
      if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }
      // Re-initialize with hints to ensure consistent behavior on restart
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.QR_CODE,
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.ITF,
      ]);
      hints.set(DecodeHintType.TRY_HARDER, true);
      
      hints.set(DecodeHintType.NEED_RESULT_POINT_CALLBACK, (point) => {
        setDetecting(true);
        if (detectTimeoutRef.current) clearTimeout(detectTimeoutRef.current);
        detectTimeoutRef.current = setTimeout(() => setDetecting(false), 500);

        if (canvasRef.current && videoRef.current) {
          const canvas = canvasRef.current;
          const video = videoRef.current;
          const ctx = canvas.getContext('2d');
          
          if (canvas.width !== video.videoWidth) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }

          ctx.fillStyle = 'rgba(0, 255, 100, 0.8)';
          ctx.beginPath();
          ctx.arc(point.getX(), point.getY(), 6, 0, 2 * Math.PI);
          ctx.fill();

          setTimeout(() => {
            ctx.clearRect(point.getX() - 8, point.getY() - 8, 16, 16);
          }, 300);
        }
      });

      codeReaderRef.current = new BrowserMultiFormatReader(hints);
    }
  };

  const sendToBackend = async (detectedBarcode) => {
    setIsLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/product-by-barcode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ barcode: detectedBarcode }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch product from backend');
      }

      const data = await response.json();
      console.log('Backend response:', data);
      
      if (onScan) {
        onScan(data);
      }
      
      toast.success(data.success ? 'Product found!' : 'New product detected');
    } catch (err) {
      console.error('Backend error:', err);
      toast.error('Could not connect to backend service. Please ensure the FastAPI server is running on port 8000.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsLoading(true);
    
    // Create a temporary image to decode in the browser first
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const img = new Image();
        img.onload = async () => {
          try {
            // 1. Try to decode in the browser first (Very reliable)
            const result = await codeReaderRef.current.decodeFromImageElement(img);
            if (result) {
              const detectedCode = result.getText();
              setBarcode(detectedCode);
              setIsScanning(false);
              stopScanning();
              toast.success(`Barcode detected: ${detectedCode}`);
              sendToBackend(detectedCode);
              setIsLoading(false);
              return;
            }
          } catch (zxingError) {
            console.log("Browser decoding failed, trying backend fallback...", zxingError);
            
            // 2. Fallback to backend if browser decoding fails
            const formData = new FormData();
            formData.append('file', file);
            
            const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
            const token = localStorage.getItem('token');
            
            try {
              const res = await fetch(`${apiUrl}/cv/scan-barcode`, {
                method: 'POST',
                headers: {
                  ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: formData
              });

              const data = await res.json();
              if (data.success && data.barcode) {
                setBarcode(data.barcode);
                setIsScanning(false);
                stopScanning();
                toast.success(`Barcode detected via backend: ${data.barcode}`);
                sendToBackend(data.barcode);
              } else {
                toast.error("No barcode found. Please ensure the image is clear and the barcode is centered.");
              }
            } catch (err) {
              console.error(err);
              toast.error("Failed to connect to backend scanner");
            } finally {
              setIsLoading(false);
            }
          }
        };
        img.src = event.target.result;
      } catch (err) {
        console.error(err);
        setIsLoading(false);
      }
    };
    reader.readAsDataURL(file);
    
    // Reset input
    e.target.value = '';
  };

  const handleRestart = () => {
    stopScanning();
    startScanning();
  };

  const captureAndScan = async () => {
    if (!videoRef.current) return;
    
    setIsLoading(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setIsLoading(false);
          toast.error("Failed to capture image");
          return;
        }

        const formData = new FormData();
        formData.append('file', blob, 'capture.jpg');
        
        const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
        const token = localStorage.getItem('token');
        
        try {
          const res = await fetch(`${apiUrl}/cv/scan-barcode`, {
            method: 'POST',
            headers: {
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: formData
          });

          const data = await res.json();
          if (data.success && data.barcode) {
            setBarcode(data.barcode);
            setIsScanning(false);
            stopScanning();
            toast.success(`Barcode detected via capture: ${data.barcode}`);
            sendToBackend(data.barcode);
          } else {
            toast.error("No barcode found in captured frame. Try adjusting the distance.");
          }
        } catch (err) {
          console.error(err);
          toast.error("Failed to connect to backend scanner");
        } finally {
          setIsLoading(false);
        }
      }, 'image/jpeg', 0.9);
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-xl mx-auto overflow-hidden border-2 border-primary/10 shadow-2xl bg-background/50 backdrop-blur-sm">
      <CardHeader className="bg-primary/5 pb-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Barcode className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold tracking-tight">Scan Barcode</CardTitle>
              <CardDescription>Scan via camera or upload an image</CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept="image/*" 
              className="hidden" 
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fileInputRef.current?.click()}
              className="gap-2 border-primary/20 hover:bg-primary/5"
              disabled={isLoading}
            >
              <Upload className="w-4 h-4" />
              Upload
            </Button>
            {isScanning ? (
            <Button 
              variant="default" 
              size="sm" 
              onClick={captureAndScan}
              className="gap-2 bg-primary/90 hover:bg-primary"
              disabled={isLoading}
            >
              <Camera className="w-4 h-4" />
              Force Capture
            </Button>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRestart}
              className="gap-2 hover:bg-primary/10 transition-colors"
            >
              <RefreshCcw className="w-4 h-4" />
              Scan Again
            </Button>
          )}
        </div>
      </div>
    </CardHeader>
      
      <CardContent className="p-0">
        <div className="relative aspect-video bg-black overflow-hidden group">
          <video 
            ref={videoRef} 
            className="w-full h-full object-cover"
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ objectFit: 'cover' }}
          />
          
          {/* Scanning Overlay */}
          {isScanning && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 bg-black/20" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-1/2 border-2 border-primary/50 rounded-lg shadow-[0_0_20px_rgba(var(--primary),0.3)]">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-md" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-md" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-md" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-md" />
                
                {/* Scanning Line Animation */}
                <div className="absolute top-0 left-0 w-full h-1 bg-primary/80 shadow-[0_0_15px_rgba(var(--primary),1)] animate-[scan_2s_linear_infinite]" 
                     style={{
                       animation: 'scan 2s linear infinite',
                     }}
                />
              </div>

              {/* Detecting State Feedback */}
              {detecting && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-green-400 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wider flex items-center gap-2 backdrop-blur-sm animate-pulse border border-green-500/30">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                  DETECTING BARCODE...
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-destructive/10 backdrop-blur-sm p-6 text-center">
              <AlertCircle className="w-12 h-12 text-destructive mb-4 animate-bounce" />
              <h3 className="text-lg font-semibold text-destructive mb-2">Camera Error</h3>
              <p className="text-sm text-muted-foreground max-w-[250px] mb-6">{error}</p>
              <Button onClick={handleRestart} variant="destructive">
                Try Again
              </Button>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-sm font-medium">Processing...</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 space-y-4">
          {barcode ? (
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="p-2 bg-green-500/20 rounded-full">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-green-700/70">Detected Barcode</p>
                <p className="text-2xl font-mono font-bold text-green-700 tracking-tight">{barcode}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-muted-foreground p-4 rounded-xl bg-muted/30 border border-border/50 italic">
              <Camera className="w-5 h-5 opacity-50" />
              <p className="text-sm">Position barcode within the frame to scan...</p>
            </div>
          )}
        </div>
      </CardContent>
      
      <style>{`
        @keyframes scan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
      `}</style>
    </Card>
  );
};

export default BarcodeScanner;
