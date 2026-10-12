import React, { useState, useRef } from 'react';
import { analyzeDocument } from '../lib/api.js';
import { DocumentAnalysisCard } from '../components/DocumentAnalysisCard.js';
import type { DocumentAnalysisResult } from '../types/index.js';
import {
  FileSearch,
  UploadCloud,
  FileCheck2,
  Sparkles,
  AlertCircle,
  Loader2,
  FileText,
  X,
  ShieldCheck,
  Check
} from 'lucide-react';

export const DocumentAnalyzerPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState('Passport');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<DocumentAnalysisResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setErrorMsg(null);

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => setPreviewUrl(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setErrorMsg(null);

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => setPreviewUrl(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleTestSample = () => {
    // Generate a lightweight canvas sample image as a real File object
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 260;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 400, 260);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('PASSPORT SAMPLE DOCUMENT', 20, 40);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px monospace';
      ctx.fillText('P<USAEXPLORER<<ALEX<<<<<<<<<<<<<<<<<<<', 20, 200);
      ctx.fillText('A123456789USA9001018M2908154<<<<<<<<<4', 20, 225);
    }
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'sample_passport_demo.png', { type: 'image/png' });
        setSelectedFile(file);
        setPreviewUrl(canvas.toDataURL());
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg('Please select or upload a document file to analyze.');
      return;
    }

    setErrorMsg(null);
    setLoading(true);
    setAnalysisResult(null);

    const formData = new FormData();
    formData.append('document', selectedFile);
    formData.append('documentType', documentType);

    try {
      const response = await analyzeDocument(formData);
      setAnalysisResult(response.data);
    } catch (err: any) {
      console.error('Document analysis error:', err);
      setErrorMsg(
        err?.response?.data?.message ||
        err?.message ||
        'Document verification failed. Please ensure the file is an image or PDF.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-10">
      {/* Title */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-300">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          Multimodal Gemini 2.5 Flash Vision
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Multimodal Document Compliance Scanner
        </h1>
        <p className="text-sm sm:text-base text-slate-400">
          Securely submit your passport bio-page or entry visa. Gemini 2.5 Flash inspects Machine Readable Zones (MRZ), verifies the mandatory 6-month validity rule, and calculates your border readiness score.
        </p>
      </div>

      {/* Upload Form Card */}
      <div className="glass-card p-6 md:p-8 border-slate-800 space-y-6">
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Target Document Classification
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="px-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="Passport">Passport (Bio-Data Page)</option>
                <option value="Visa">Consular Visa Sticker / eVisa PDF</option>
                <option value="Boarding Pass">Boarding Pass / Flight Ticket</option>
                <option value="Vaccination Record">Vaccination / Health Certificate</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleTestSample}
              className="self-start sm:self-auto px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-cyan-300 border border-slate-700 flex items-center gap-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Use Test Sample Document
            </button>
          </div>

          {/* Drag & Drop Area */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              selectedFile
                ? 'border-emerald-500/40 bg-emerald-950/10'
                : 'border-slate-700 hover:border-cyan-500/40 hover:bg-slate-900/40'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,application/pdf"
              className="hidden"
            />

            {selectedFile ? (
              <div className="space-y-4">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Uploaded preview"
                    className="max-h-48 mx-auto rounded-xl border border-slate-700 shadow-md object-contain"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
                    <FileText className="w-8 h-8" />
                  </div>
                )}
                <div>
                  <div className="text-sm font-bold text-white">{selectedFile.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {(selectedFile.size / 1024).toFixed(1)} KB • Click to replace file
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-slate-800/80 text-cyan-400 flex items-center justify-center mx-auto">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">
                    Drop your passport or visa photo here
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Supports high-resolution PNG, JPG, or PDF up to 10MB
                  </div>
                </div>
                <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 text-slate-300">
                  Select File from Computer
                </span>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !selectedFile}
            className="w-full py-4 px-6 rounded-xl font-extrabold text-sm bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-50 text-navy-950 shadow-glow-cyan flex items-center justify-center gap-2 transition-all transform active:scale-98"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-navy-950" />
                <span>Multimodal Vision Inspecting Document...</span>
              </>
            ) : (
              <>
                <FileCheck2 className="w-5 h-5 text-navy-950" />
                <span>Verify Document & Calculate Readiness Score</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Analysis Result Output */}
      {analysisResult && selectedFile && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" /> Verification Complete
            </h2>
            <span className="text-xs text-emerald-400 font-mono">Persisted to PostgreSQL RLS</span>
          </div>

          <DocumentAnalysisCard analysis={analysisResult} fileName={selectedFile.name} />
        </div>
      )}
    </div>
  );
};
