import { useCallback, useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { Loader2, ScanLine } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { lookupBarcode, type BarcodeProduct } from '@/lib/barcodeProduct';

type ScanState =
  | { status: 'scanning' }
  | { status: 'looking' }
  | { status: 'notfound' }
  | { status: 'error'; message: string };

interface Props {
  open: boolean;
  onClose: () => void;
  /** Called when a product is successfully identified. Sheet stays open until parent closes it. */
  onProduct: (product: BarcodeProduct) => void;
}

export function BarcodeScanner({ open, onClose, onProduct }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const handledRef = useRef(false);
  const [state, setState] = useState<ScanState>({ status: 'scanning' });

  const stopCamera = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
  }, []);

  const startCamera = useCallback(() => {
    if (!videoRef.current) return;
    handledRef.current = false;
    setState({ status: 'scanning' });

    const reader = new BrowserMultiFormatReader();
    reader
      .decodeFromVideoDevice(undefined, videoRef.current, async (result, err) => {
        // err fires every frame when no barcode is visible — ignore those
        if (!result || handledRef.current) return;
        if (err) return;

        handledRef.current = true;
        setState({ status: 'looking' });

        try {
          const product = await lookupBarcode(result.getText());
          if (!product) {
            setState({ status: 'notfound' });
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
      })
      .then((controls) => {
        controlsRef.current = controls;
      })
      .catch(() => {
        setState({ status: 'error', message: 'Could not access camera.' });
      });
  }, [onProduct]);

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
          <p className="text-sm text-text-muted">Product not found in database.</p>
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
