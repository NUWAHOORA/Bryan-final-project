import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QrScannerProps {
  onScan: (decodedText: string) => void;
  enabled: boolean;
}

export function QrScanner({ onScan, enabled }: QrScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerId = 'qr-reader';
  const lastScannedRef = useRef<string>('');
  const lastScannedTimeRef = useRef<number>(0);

  const startScanner = async () => {
    setError(null);
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(containerId);
      }

      await scannerRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          // Debounce: don't fire same code within 3 seconds
          const now = Date.now();
          if (decodedText === lastScannedRef.current && now - lastScannedTimeRef.current < 3000) {
            return;
          }
          lastScannedRef.current = decodedText;
          lastScannedTimeRef.current = now;
          onScan(decodedText);
        },
        () => {} // ignore errors during scanning
      );
      setIsScanning(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to start camera. Please allow camera access.');
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    try {
      if (scannerRef.current && isScanning) {
        await scannerRef.current.stop();
        setIsScanning(false);
      }
    } catch {
      // ignore stop errors
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!enabled && isScanning) {
      stopScanner();
    }
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className="space-y-4">
      <div
        id={containerId}
        className="w-full aspect-video rounded-xl overflow-hidden bg-muted"
      />

      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}

      <div className="flex justify-center">
        {!isScanning ? (
          <Button onClick={startScanner} className="gradient-primary text-white">
            <Camera className="w-4 h-4 mr-2" />
            Start Scanner
          </Button>
        ) : (
          <Button onClick={stopScanner} variant="outline">
            <CameraOff className="w-4 h-4 mr-2" />
            Stop Scanner
          </Button>
        )}
      </div>
    </div>
  );
}
