import React, { useState } from 'react';
import type { VisaCheckResult } from '../types/index.js';
import { StatusBadge } from './StatusBadge.js';
import {
  ShieldAlert,
  Clock,
  DollarSign,
  FileCheck2,
  Syringe,
  AlertTriangle,
  FileText,
  Copy,
  Check,
  PlaneTakeoff,
  Landmark
} from 'lucide-react';

interface VisaCheckCardProps {
  result: VisaCheckResult;
}

export const VisaCheckCard: React.FC<VisaCheckCardProps> = ({ result }) => {
  const [checkedDocs, setCheckedDocs] = useState<Record<number, boolean>>({});
  const [copied, setCopied] = useState(false);

  const toggleDoc = (index: number) => {
    setCheckedDocs(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleCopy = () => {
    const text = `
Visa Assessment: ${result.passportCountry} -> ${result.destinationCountry}
Status: ${result.visaStatus}
Stay Allowed: ${result.stayAllowed}
Passport Rule: ${result.passportValidityRequirement}
Processing Time: ${result.processingTime}
Fees: ${result.estimatedFees}

Required Documents:
${result.requiredDocuments.map(d => ` - ${d}`).join('\n')}

Financial Proof:
${result.financialProofGuidelines}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-card p-6 md:p-8 space-y-8 animate-fadeIn border-indigo-500/30 shadow-glow-indigo">
      {/* Top Banner with Verdict */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-2 text-xs text-slate-400 font-medium">
            <span>Passport: <strong className="text-white">{result.passportCountry}</strong></span>
            <span>→</span>
            <span>Destination: <strong className="text-cyan-400">{result.destinationCountry}</strong></span>
          </div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Immigration Verdict
            </h2>
            <StatusBadge status={result.visaStatus} className="text-sm px-3.5 py-1" />
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="self-start md:self-auto flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
          {copied ? 'Copied' : 'Share Policy'}
        </button>
      </div>

      {/* 4 Essential Immigration Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-navy-950/70 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>Permitted Stay</span>
          </div>
          <span className="text-sm font-bold text-white block">
            {result.stayAllowed}
          </span>
        </div>

        <div className="bg-navy-950/70 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Landmark className="w-4 h-4 text-indigo-400" />
            <span>Processing Time</span>
          </div>
          <span className="text-sm font-bold text-white block">
            {result.processingTime}
          </span>
        </div>

        <div className="bg-navy-950/70 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Consular / Visa Fees</span>
          </div>
          <span className="text-sm font-bold text-emerald-300 block">
            {result.estimatedFees}
          </span>
        </div>

        <div className="bg-navy-950/70 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <FileText className="w-4 h-4 text-amber-400" />
            <span>Passport Validity</span>
          </div>
          <span className="text-xs font-semibold text-slate-200 block leading-snug">
            {result.passportValidityRequirement}
          </span>
        </div>
      </div>

      {/* Mandatory Documents Checklist */}
      <div className="bg-slate-900/40 p-5 md:p-6 rounded-2xl border border-slate-800/80 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-cyan-400" /> Mandatory Document Checklist
          </h3>
          <span className="text-xs text-slate-400">
            {Object.values(checkedDocs).filter(Boolean).length} of {result.requiredDocuments.length} Prepared
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {result.requiredDocuments.map((doc, idx) => {
            const isChecked = !!checkedDocs[idx];
            return (
              <div
                key={idx}
                onClick={() => toggleDoc(idx)}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer select-none transition-all ${
                  isChecked
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                    : 'bg-navy-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className={`w-5 h-5 rounded-md mt-0.5 flex items-center justify-center border transition-all ${
                  isChecked
                    ? 'bg-emerald-500 border-emerald-500 text-navy-950'
                    : 'border-slate-700 bg-slate-900'
                }`}>
                  {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <span className={`text-xs md:text-sm font-medium leading-relaxed ${isChecked ? 'line-through opacity-80' : ''}`}>
                  {doc}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Financial & Health Requirements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900/40 p-5 rounded-xl border border-slate-800/80 space-y-2">
          <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" /> Proof of Financial Solvency
          </h4>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            {result.financialProofGuidelines}
          </p>
        </div>

        <div className="bg-slate-900/40 p-5 rounded-xl border border-slate-800/80 space-y-2">
          <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
            <Syringe className="w-4 h-4 text-cyan-400" /> Health & Vaccination Mandates
          </h4>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {result.healthAndVaccineMandates.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Critical Warnings & Checkpoint Advice */}
      <div className="bg-rose-950/15 border border-rose-500/30 p-5 rounded-xl space-y-3">
        <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400" /> Crucial Immigration Advisories & Restrictions
        </h4>
        <ul className="space-y-2 text-xs text-slate-300">
          {result.importantAdvisories.map((advisory, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-rose-400 font-bold">•</span>
              <span>{advisory}</span>
            </li>
          ))}
        </ul>

        {result.entryCheckpoints && (
          <div className="pt-2 border-t border-rose-500/20 flex items-center gap-2 text-xs text-slate-400">
            <PlaneTakeoff className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Checkpoints & Digital Arrival: {result.entryCheckpoints}</span>
          </div>
        )}
      </div>
    </div>
  );
};
