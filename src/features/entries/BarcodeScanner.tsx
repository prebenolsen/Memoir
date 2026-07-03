import { useCallback, useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import { Loader2, ScanLine } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { lookupBarcode, type BarcodeProduct } from '@/lib/barcodeProduct';

// Retail product barcodes only — restricting formats makes every decode
// attempt far cheaper than the multi-format default (QR, Aztec, PDF417, …).
const ZXING_FORMATS = [
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
];
const NATIVE_FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e'];

// The native BarcodeDetector API (Chrome on Android — backed by ML Kit, the
// same engine the Open Food Facts app uses) isn't in TypeScript's DOM lib yet.
interface NativeDetector {
  detect(source: CanvasImageSource): Promise<{ rawValue: string }[]>;
}
type NativeDetectorCtor = new (options?: { formats?: string[] }) => NativeDetector;

function createNativeDetector(): NativeDetector | null {
  const Ctor = (window as unknown as { BarcodeDetector?: NativeDetectorCtor }).BarcodeDetector;
  if (!Ctor) return null;
  try {
    return new Ctor({ formats: NATIVE_FORMATS });
  } catch {
    return null;
  }
}

type ScanState =
  | { status: 'scanning' }
  | { status: 'looking' }
  | { status: 'notfound'; code: string }
  | { status: 'error'; message: string };

interface Props {
  open: boolean;
  onClose: () => void;
  /** Called when a product is successfully identified. Sheet stays open until parent closes it. */
  onProduct: (product: BarcodeProduct) => void;
}

export function BarcodeScanner({ open, onClose, onProduct }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const handledRef = useRef(false);
  const lastMissRef = useRef<{ code: string; at: number } | null>(null);
  const [state, setState] = useState<ScanState>({ status: 'scanning' });

  const stopCamera = useCallback(() => {
    cleanupRef.current?.();
    cleanupRef.current = null;
  }, []);

  const handleCode = useCallback(
    async (code: string) => {
      if (handledRef.current) return;
      // Camera keeps scanning after a miss — don't hammer the API re-looking-up
      // the same barcode while it's still in frame.
      const miss = lastMissRef.current;
      if (miss && miss.code === code && Date.now() - miss.at < 5000) return;

      handledRef.current = true;
      setState({ status: 'looking' });

      try {
        const product = await lookupBarcode(code);
        if (!product) {
          lastMissRef.current = { code, at: Date.now() };
          setState({ status: 'notfound', code });
          handledRef.current = false;
          return;
        }
        onProduct(product);
      } catch (e) {
        setState({
          status: 'error',
          message: e instanceof Error ? e.message : 'Something went wrong.',
        });
        handledRef.current = false;
      }
    },
    [onProduct],
  );

  const startCamera = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    handledRef.current = false;
    lastMissRef.current = null;
    setState({ status: 'scanning' });

    let cancelled = false;
    let stream: MediaStream | null = null;
    let zxingControls: { stop: () => void } | null = null;
    let nativeTimer: number | undefined;

    cleanupRef.current = () => {
      cancelled = true;
      window.clearTimeout(nativeTimer);
      zxingControls?.stop();
      stream?.getTracks().forEach((t) => t.stop());
      video.srcObject = null;
    };

    (async () => {
      // Ask for the back camera at 720p — the browser default is often a
      // low-res feed from the wrong lens, which makes barcodes undecodable
      // until held at exactly the right distance.
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      // Continuous autofocus keeps close-up barcodes sharp on phone cameras.
      try {
        await stream.getVideoTracks()[0].applyConstraints({
          advanced: [{ focusMode: 'continuous' }] as unknown as MediaTrackConstraintSet[],
        });
      } catch {
        // Not supported on this device/browser — fine.
      }

      const detector = createNativeDetector();
      if (detector) {
        video.srcObject = stream;
        await video.play();
        const tick = async () => {
          if (cancelled) return;
          if (!handledRef.current && video.readyState >= 2) {
            try {
              const codes = await detector.detect(video);
              if (!cancelled && codes.length > 0) void handleCode(codes[0].rawValue);
            } catch {
              // Frame not decodable yet — keep going.
            }
          }
          nativeTimer = window.setTimeout(tick, 100);
        };
        void tick();
        return;
      }

      const hints = new Map<DecodeHintType, unknown>();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, ZXING_FORMATS);
      const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 80 });
      const controls = await reader.decodeFromStream(stream, video, (result) => {
        if (result) void handleCode(result.getText());
      });
      if (cancelled) controls.stop();
      else zxingControls = controls;
    })().catch(() => {
      if (!cancelled) setState({ status: 'error', message: 'Could not access camera.' });
    });
  }, [handleCode]);

  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
    }
    return stopCamera;
  }, [open, startCamera, stopCamera]);

  const retry = () => {
    stopCamera();
    startCamera();
  };

  const isIdle = state.status === 'scanning';
  const isLooking = state.status === 'looking';

  return (
    <Sheet open={open} onClose={onClose} title="Scan barcode">
      {/* Camera view */}
      <div className="relative -mx-4 overflow-hidden rounded-none bg-black" style={{ height: 280 }}>
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          autoPlay
          muted
          playsInline
        />

        {/* Scanning overlay */}
        {isIdle && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2">
            <ScanLine size={48} className="text-white/80" />
            <span className="text-sm text-white/70">Point at a barcode</span>
          </div>
        )}

        {/* Looking up spinner */}
        {isLooking && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60">
            <Loader2 size={32} className="animate-spin text-white" />
            <span className="text-sm text-white">Looking up product…</span>
          </div>
        )}
      </div>

      {/* Status messages */}
      {state.status === 'notfound' && (
        <div className="mt-4 text-center">
          <p className="text-sm text-text-muted">
            Product not found in database ({state.code}).
          </p>
          <Button variant="secondary" className="mt-3" onClick={retry}>
            Try again
          </Button>
        </div>
      )}

      {state.status === 'error' && (
        <div className="mt-4 text-center">
          <p className="text-sm text-text-muted">{state.message}</p>
          <Button variant="secondary" className="mt-3" onClick={retry}>
            Try again
          </Button>
        </div>
      )}
    </Sheet>
  );
}
