import React from 'react';
import type { DocumentAnalysisResult } from '../types/index.js';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Calendar,
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface DocumentAnalysisCardProps {
  analysis: DocumentAnalysisResult;
  fileName: string;
}

export const DocumentAnalysisCard: React.FC<DocumentAnalysisCardProps> = ({ analysis, fileName }) => {
  const score = analysis.travelReadinessScore || 85;
  const isHigh = score >= 80;
  const isMedium = score >= 50 && score < 80;

  return (
    <div className="glass-card p-6 md:p-8 space-y-8 animate-fadeIn border-cyan-500/30 shadow-glow-cyan">
      {/* Header & Overall Score */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-800">
        <div>
          <span className="glass-pill text-cyan-400 border-cyan-500/30 flex items-center gap-1 w-max mb-2">
            <Sparkles className="w-3 h-3" /> Multimodal Vision Verification
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Compliance Inspection Report
          </h2>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" /> File: {fileName}
          </p>
        </div>

        {/* Readiness Score Gauge */}
        <div className="flex items-center gap-4 bg-navy-950/80 px-5 py-3.5 rounded-2xl border border-slate-800 self-start sm:self-auto">
          <div className="relative w-14 h-14 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={isHigh ? 'text-emerald-400' : isMedium ? 'text-amber-400' : 'text-rose-400'}
                strokeDasharray={`${score}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-sm font-extrabold text-white">
              {score}%
            </span>
          </div>

          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Border Readiness
            </div>
            <div className={`text-sm font-bold ${isHigh ? 'text-emerald-400' : isMedium ? 'text-amber-400' : 'text-rose-400'}`}>
              {isHigh ? 'Fully Compliant' : isMedium ? 'Review Required' : 'High Risk'}
            </div>
          </div>
        </div>
      </div>

      {/* Extracted Metadata Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-navy-950/70 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Document Type</span>
          <span className="text-sm font-bold text-white block">
            {analysis.documentType}
          </span>
        </div>

        <div className="bg-navy-950/70 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Issuing Authority</span>
          <span className="text-sm font-bold text-cyan-300 block">
            {analysis.detectedCountry || 'International Standard'}
          </span>
        </div>

        <div className="bg-navy-950/70 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Expiration Status</span>
          <span className={`text-sm font-bold block ${
            analysis.validityStatus === 'Valid' ? 'text-emerald-400' : 'text-amber-400'
          }`}>
            {analysis.validityStatus}
          </span>
        </div>

        <div className="bg-navy-950/70 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Expiry Date</span>
          <span className="text-sm font-bold text-white block">
            {analysis.expirationDate || 'Standard Expiry'}
          </span>
        </div>
      </div>

      {/* ICAO 9303 Compliance Checkpoints */}
      <div className="bg-slate-900/40 p-5 md:p-6 rounded-2xl border border-slate-800/80 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" /> ICAO 9303 Security Checkpoints
        </h3>

        <div className="space-y-3">
          {analysis.complianceChecklist.map((item, idx) => (
            <div
              key={idx}
              className="flex items-start justify-between gap-4 p-3.5 rounded-xl bg-navy-950/60 border border-slate-800"
            >
              <div className="space-y-0.5">
                <div className="text-xs md:text-sm font-semibold text-slate-200">
                  {item.item}
                </div>
                <div className="text-xs text-slate-400 leading-relaxed">
                  {item.details}
                </div>
              </div>

              <div>
                {item.status === 'PASS' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3" /> PASS
                  </span>
                )}
                {item.status === 'WARNING' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    <AlertTriangle className="w-3 h-3" /> WARNING
                  </span>
                )}
                {item.status === 'FAIL' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                    <XCircle className="w-3 h-3" /> FAIL
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-slate-900/40 p-5 rounded-xl border border-slate-800/80 space-y-2">
        <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
          Actionable Border Security Advice
        </h4>
        <ul className="space-y-2 text-xs md:text-sm text-slate-300">
          {analysis.recommendations.map((rec, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-cyan-400 font-bold">•</span>
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Statutory Heuristic Disclaimer (Phase 5 Requirement) */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700/80 text-[11px] text-slate-400 space-y-1.5">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 shrink-0 text-amber-400" />
          <span>Non-Governmental Heuristic Assessment Notice</span>
        </div>
        <p className="leading-relaxed">
          This document analysis is an AI-assisted readiness evaluation based on ICAO 9303 formatting conventions and optical clarity. <strong>This does not constitute official government authentication, legal document verification, or a guarantee of border admittance.</strong> Physical inspection and validation remain exclusively within the purview of sovereign immigration officers.
        </p>
      </div>
    </div>
  );
};
