import React, { useState } from 'react';
import { X, Columns2, Clock, Zap, ArrowRight, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
import { TestResult } from '../types/prompt';
import { formatDuration } from '../utils/tokenEstimator';

interface ResultsComparisonProps {
  results: TestResult[];
  initialRunA?: TestResult;
  initialRunB?: TestResult;
  onClose: () => void;
}

export const ResultsComparison: React.FC<ResultsComparisonProps> = ({
  results,
  initialRunA,
  initialRunB,
  onClose,
}) => {
  const [selectedIdA, setSelectedIdA] = useState<string>(
    initialRunA?.id || results[0]?.id || ''
  );
  const [selectedIdB, setSelectedIdB] = useState<string>(
    initialRunB?.id || results[1]?.id || results[0]?.id || ''
  );
  const [mobileTab, setMobileTab] = useState<'A' | 'B'>('A');

  const runA = results.find((r) => r.id === selectedIdA);
  const runB = results.find((r) => r.id === selectedIdB);

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-5xl h-[92dvh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Columns2 className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold text-slate-100 truncate">
              Side-by-Side Fresh Test Comparison
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selection Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-800 bg-slate-950/60 border-b border-slate-800 px-3 py-2 shrink-0 gap-2 sm:gap-0">
          {/* Select Run A */}
          <div className="sm:pr-3 flex items-center justify-between gap-2">
            <label className="text-xs font-semibold text-indigo-400 shrink-0">Variant A:</label>
            <select
              value={selectedIdA}
              onChange={(e) => setSelectedIdA(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none w-full max-w-[240px] truncate"
            >
              {results.map((r) => (
                <option key={r.id} value={r.id}>
                  Run #{r.runNumber} ({formatDuration(r.durationMs)}, Temp: {r.temperature})
                </option>
              ))}
            </select>
          </div>

          {/* Select Run B */}
          <div className="sm:pl-3 flex items-center justify-between gap-2 pt-1 sm:pt-0">
            <label className="text-xs font-semibold text-emerald-400 shrink-0">Variant B:</label>
            <select
              value={selectedIdB}
              onChange={(e) => setSelectedIdB(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none w-full max-w-[240px] truncate"
            >
              {results.map((r) => (
                <option key={r.id} value={r.id}>
                  Run #{r.runNumber} ({formatDuration(r.durationMs)}, Temp: {r.temperature})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Mobile View Toggle (< sm) */}
        <div className="sm:hidden flex border-b border-slate-800 bg-slate-900 shrink-0">
          <button
            onClick={() => setMobileTab('A')}
            className={`flex-1 py-1.5 text-xs font-medium border-b-2 text-center transition-colors ${
              mobileTab === 'A'
                ? 'border-indigo-500 text-indigo-300 bg-slate-800/40'
                : 'border-transparent text-slate-400'
            }`}
          >
            Variant A (Run #{runA?.runNumber || '?'})
          </button>
          <button
            onClick={() => setMobileTab('B')}
            className={`flex-1 py-1.5 text-xs font-medium border-b-2 text-center transition-colors ${
              mobileTab === 'B'
                ? 'border-emerald-500 text-emerald-300 bg-slate-800/40'
                : 'border-transparent text-slate-400'
            }`}
          >
            Variant B (Run #{runB?.runNumber || '?'})
          </button>
        </div>

        {/* Comparison Content */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-800 overflow-y-auto">
          {/* Column A (Shown always on desktop, toggled on mobile) */}
          <div className={`p-3 sm:p-4 flex flex-col space-y-3 overflow-y-auto ${mobileTab !== 'A' ? 'hidden sm:flex' : 'flex'}`}>
            {runA ? (
              <>
                <div className="p-2.5 bg-slate-950/70 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-indigo-300 font-mono text-sm">Run #{runA.runNumber}</span>
                    <span className="ml-2 text-slate-400 font-mono">{runA.model}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-300 font-semibold">{formatDuration(runA.durationMs)}</span>
                    <span className="text-slate-400 text-[11px]">{runA.usage?.totalTokens || 0} tok</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 bg-slate-950/40 p-2 rounded border border-slate-800/80">
                  <span className="font-medium text-slate-300">Files: </span>
                  {runA.filesSnapshot?.map((f) => f.name).join(', ') || 'None'}
                </div>

                <div className="flex-1 bg-slate-950/80 p-3 rounded-lg border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto whitespace-pre-wrap break-words leading-relaxed select-text">
                  {runA.output}
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">Select Run A</div>
            )}
          </div>

          {/* Column B */}
          <div className={`p-3 sm:p-4 flex flex-col space-y-3 overflow-y-auto ${mobileTab !== 'B' ? 'hidden sm:flex' : 'flex'}`}>
            {runB ? (
              <>
                <div className="p-2.5 bg-slate-950/70 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-emerald-300 font-mono text-sm">Run #{runB.runNumber}</span>
                    <span className="ml-2 text-slate-400 font-mono">{runB.model}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-300 font-semibold">{formatDuration(runB.durationMs)}</span>
                    <span className="text-slate-400 text-[11px]">{runB.usage?.totalTokens || 0} tok</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 bg-slate-950/40 p-2 rounded border border-slate-800/80">
                  <span className="font-medium text-slate-300">Files: </span>
                  {runB.filesSnapshot?.map((f) => f.name).join(', ') || 'None'}
                </div>

                <div className="flex-1 bg-slate-950/80 p-3 rounded-lg border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto whitespace-pre-wrap break-words leading-relaxed select-text">
                  {runB.output}
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">Select Run B</div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-800/40 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-400">
            {runA && runB && (
              <span>
                Δ Latency: <strong className="text-slate-200">{Math.abs(runA.durationMs - runB.durationMs)}ms</strong>
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
