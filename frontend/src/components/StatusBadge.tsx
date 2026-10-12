import React from 'react';
import { CheckCircle2, AlertTriangle, FileText, Globe, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const norm = (status || '').toLowerCase();

  if (norm.includes('free')) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 ${className}`}>
        <CheckCircle2 className="w-3.5 h-3.5" />
        Visa Free
      </span>
    );
  }

  if (norm.includes('evisa')) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 ${className}`}>
        <Globe className="w-3.5 h-3.5" />
        eVisa Required
      </span>
    );
  }

  if (norm.includes('arrival')) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 ${className}`}>
        <FileText className="w-3.5 h-3.5" />
        Visa on Arrival
      </span>
    );
  }

  if (norm.includes('embassy') || norm.includes('required')) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30 ${className}`}>
        <AlertTriangle className="w-3.5 h-3.5" />
        Embassy Visa Required
      </span>
    );
  }

  if (norm.includes('restrict') || norm.includes('denied') || norm.includes('ban')) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 ${className}`}>
        <XCircle className="w-3.5 h-3.5" />
        Entry Restricted
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-700/50 text-slate-300 border border-slate-600/50 ${className}`}>
      {status}
    </span>
  );
};
