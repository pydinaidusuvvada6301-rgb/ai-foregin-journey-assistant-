import React, { useState } from 'react';
import { detectUserLocation, DetectedLocationResult } from '../lib/geolocation.js';
import { MapPin, Loader2, CheckCircle2, AlertCircle, Compass } from 'lucide-react';

interface LocationDetectorButtonProps {
  onLocationDetected: (locationText: string, fullData: DetectedLocationResult) => void;
  className?: string;
  variant?: 'compact' | 'pill' | 'button';
  label?: string;
}

export const LocationDetectorButton: React.FC<LocationDetectorButtonProps> = ({
  onLocationDetected,
  className = '',
  variant = 'compact',
  label = 'Detect My Location'
}) => {
  const [detecting, setDetecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const handleDetect = async () => {
    if (detecting) return;
    setDetecting(true);
    setStatusMessage('Requesting GPS coordinate access...');
    setIsError(false);

    try {
      const res = await detectUserLocation();

      if (res.success && res.data) {
        const text = res.data.formattedOrigin;
        onLocationDetected(text, res.data);
        setStatusMessage(`Detected: ${text}`);
        setIsError(false);
        setTimeout(() => setStatusMessage(null), 4000);
      } else {
        setStatusMessage(res.error || 'Could not determine location.');
        setIsError(true);
        setTimeout(() => setStatusMessage(null), 6000);
      }
    } catch (e: any) {
      setStatusMessage('Location service error. Please type manually.');
      setIsError(true);
      setTimeout(() => setStatusMessage(null), 5000);
    } finally {
      setDetecting(false);
    }
  };

  if (variant === 'pill') {
    return (
      <div className="inline-flex flex-col items-start gap-1">
        <button
          type="button"
          onClick={handleDetect}
          disabled={detecting}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
            detecting
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse'
              : 'bg-navy-950/80 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-700/80 hover:border-cyan-500/40'
          } ${className}`}
          title="Click to detect your current city and origin passport region via browser Geolocation"
        >
          {detecting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
          ) : (
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
          )}
          <span>{detecting ? 'Detecting Location...' : label}</span>
        </button>

        {statusMessage && (
          <div
            className={`text-[11px] flex items-center gap-1 px-2 py-0.5 rounded-md animate-fadeIn ${
              isError
                ? 'text-rose-400 bg-rose-500/10 border border-rose-500/20'
                : 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
            }`}
          >
            {isError ? (
              <AlertCircle className="w-3 h-3 shrink-0" />
            ) : (
              <CheckCircle2 className="w-3 h-3 shrink-0" />
            )}
            <span>{statusMessage}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleDetect}
        disabled={detecting}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
          detecting
            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 cursor-wait'
            : 'bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/40 shadow-sm'
        } ${className}`}
        title="Detect your current city and country using browser location"
      >
        {detecting ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
        ) : (
          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
        )}
        <span>{detecting ? 'Detecting...' : label}</span>
      </button>

      {statusMessage && (
        <div
          className={`text-[11px] flex items-center gap-1 px-2.5 py-1 rounded-lg animate-fadeIn z-10 ${
            isError
              ? 'text-rose-300 bg-rose-950/80 border border-rose-500/30'
              : 'text-emerald-300 bg-emerald-950/80 border border-emerald-500/30'
          }`}
        >
          {isError ? (
            <AlertCircle className="w-3 h-3 shrink-0 text-rose-400" />
          ) : (
            <CheckCircle2 className="w-3 h-3 shrink-0 text-emerald-400" />
          )}
          <span>{statusMessage}</span>
        </div>
      )}
    </div>
  );
};
