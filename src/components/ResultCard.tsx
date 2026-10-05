import React, { useState } from 'react';
import {
  Clock,
  Zap,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { TestResult } from '../types/prompt';
import { formatDuration } from '../utils/tokenEstimator';

interface ResultCardProps {
  result: TestResult;
  isLatest?: boolean;
  onUpdateResult?: (updated: Partial<TestResult>) => void;
  onCompareWith?: (result: TestResult) => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  result,
  isLatest = false,
  onUpdateResult,
  onCompareWith,
}) => {
  const [viewMode, setViewMode] = useState<'formatted' | 'raw' | 'json'>('formatted');
  const [showSnapshot, setShowSnapshot] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(result.output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  // Determine if output is valid JSON
  let isJson = false;
  let parsedJson: any = null;
  try {
    let clean = result.output.trim();
    if (clean.startsWith('```json')) {
      clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (clean.startsWith('```')) {
      clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    parsedJson = JSON.parse(clean);
    isJson = true;
  } catch {
    isJson = false;
  }

  // Token speed
  const tokensPerSec =
    result.durationMs > 0 && result.usage?.candidatesTokens
      ? ((result.usage.candidatesTokens / result.durationMs) * 1000).toFixed(1)
      : null;

  const passedAssertions = result.assertionResults?.filter((a) => a.passed).length || 0;
  const totalAssertions = result.assertionResults?.length || 0;

  return (
    <div
      className={`rounded-xl border transition-all ${
        isLatest
          ? 'bg-slate-900 border-indigo-500/40 shadow-xl shadow-indigo-950/20'
          : 'bg-slate-900/80 border-slate-800'
      }`}
    >
      {/* Top Bar: Run Number & Stateless Guarantee */}
      <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-800/40 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-600/30 text-indigo-300 border border-indigo-500/30">
            Run #{result.runNumber}
          </span>

          {/* Stateless Badge */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Fresh Test</span>
          </div>

          <span className="text-[11px] text-slate-500 hidden sm:inline">
            {new Date(result.timestamp).toLocaleTimeString()}
          </span>
        </div>

        {/* View toggles & Quick Actions */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Format mode selector */}
          <div className="flex bg-slate-950/70 p-0.5 rounded-md border border-slate-800 text-[11px]">
            <button
              onClick={() => setViewMode('formatted')}
              className={`px-2 py-0.5 rounded transition-colors ${
                viewMode === 'formatted'
                  ? 'bg-indigo-600 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Formatted
            </button>
            <button
              onClick={() => setViewMode('raw')}
              className={`px-2 py-0.5 rounded transition-colors ${
                viewMode === 'raw'
                  ? 'bg-indigo-600 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Raw
            </button>
            {isJson && (
              <button
                onClick={() => setViewMode('json')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  viewMode === 'json'
                    ? 'bg-emerald-600 text-white font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                JSON
              </button>
            )}
          </div>

          {/* Compare Button */}
          {onCompareWith && (
            <button
              onClick={() => onCompareWith(result)}
              className="text-[11px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title="Compare this run side-by-side with another"
            >
              Compare
            </button>
          )}

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            title="Copy response text"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Metrics Strip (Responsive wrap) */}
      <div className="px-3 sm:px-4 py-2 bg-slate-950/40 border-b border-slate-800/80 flex items-center justify-between text-xs flex-wrap gap-2 text-slate-400">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" />
            <span className="text-slate-200 font-semibold">{formatDuration(result.durationMs)}</span>
          </div>

          <div className="flex items-center gap-1 text-[11px]">
            <span className="text-slate-500">•</span>
            <span>Tokens:</span>
            <span className="text-slate-200 font-medium">
              {result.usage?.promptTokens || 0} in / {result.usage?.candidatesTokens || 0} out
            </span>
          </div>

          {tokensPerSec && (
            <div className="flex items-center gap-1 hidden xs:flex text-[11px]">
              <span className="text-slate-500">•</span>
              <Zap className="w-3 h-3 text-cyan-400" />
              <span className="text-slate-300 font-medium">{tokensPerSec} tok/s</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-[10px] sm:text-[11px]">
          <span className="text-slate-400 font-mono truncate max-w-[120px]">{result.model}</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">T: {result.temperature}</span>
        </div>
      </div>

      {/* Assertions Bar (if any) */}
      {result.assertionResults && result.assertionResults.length > 0 && (
        <div className="px-3 sm:px-4 py-2 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-1 font-medium text-slate-300 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            Assertions:
            <span
              className={`px-1.5 py-0.2 rounded font-bold ${
                passedAssertions === totalAssertions
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}
            >
              {passedAssertions}/{totalAssertions} Passed
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {result.assertionResults.map((a, idx) => (
              <span
                key={idx}
                className={`text-[10px] px-2 py-0.5 rounded flex items-center gap-1 border ${
                  a.passed
                    ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40'
                    : 'bg-red-950/40 text-red-300 border-red-800/40'
                }`}
                title={a.message}
              >
                {a.passed ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <XCircle className="w-3 h-3 text-red-400" />}
                {a.expected}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Body: Result Output */}
      <div className="p-3 sm:p-4 overflow-hidden">
        {result.status === 'running' ? (
          <div className="flex items-center gap-2 text-indigo-400 text-xs py-4 animate-pulse">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>Generating fresh stateless response from Gemini...</span>
          </div>
        ) : result.status === 'error' ? (
          <div className="p-3 rounded-lg bg-red-950/30 border border-red-800/60 text-red-300 text-xs">
            <div className="font-semibold flex items-center gap-1.5 mb-1">
              <XCircle className="w-4 h-4 text-red-400" />
              Execution Error
            </div>
            <p className="font-mono text-[11px] whitespace-pre-wrap break-words">{result.error}</p>
          </div>
        ) : viewMode === 'raw' ? (
          <pre className="text-xs font-mono text-slate-200 bg-slate-950/80 p-3 sm:p-3.5 rounded-lg border border-slate-800 overflow-x-auto whitespace-pre-wrap break-words leading-relaxed max-h-[60vh]">
            {result.output}
          </pre>
        ) : viewMode === 'json' && parsedJson ? (
          <pre className="text-xs font-mono text-emerald-300 bg-slate-950/90 p-3 sm:p-3.5 rounded-lg border border-slate-800 overflow-x-auto break-words leading-relaxed max-h-[60vh]">
            {JSON.stringify(parsedJson, null, 2)}
          </pre>
        ) : (
          <div className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans max-w-none break-words">
            <div className="whitespace-pre-wrap font-sans space-y-2">
              {result.output}
            </div>
          </div>
        )}
      </div>

      {/* Feedback & Snapshot Footer */}
      <div className="px-3 sm:px-4 py-2.5 bg-slate-800/20 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
        {/* Rating and notes */}
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <span className="text-[11px] text-slate-400 shrink-0">Rate:</span>
          <button
            onClick={() => onUpdateResult?.({ rating: result.rating === 'up' ? null : 'up' })}
            className={`p-1.5 rounded transition-colors ${
              result.rating === 'up'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Good output"
          >
            <ThumbsUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onUpdateResult?.({ rating: result.rating === 'down' ? null : 'down' })}
            className={`p-1.5 rounded transition-colors ${
              result.rating === 'down'
                ? 'bg-red-500/20 text-red-400'
                : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Poor output"
          >
            <ThumbsDown className="w-3.5 h-3.5" />
          </button>

          <input
            type="text"
            placeholder="Add quick review note..."
            value={result.notes || ''}
            onChange={(e) => onUpdateResult?.({ notes: e.target.value })}
            className="flex-1 sm:w-56 bg-slate-950/70 border border-slate-800 focus:border-indigo-500 rounded px-2.5 py-1 text-xs text-slate-300 placeholder-slate-600 focus:outline-none"
          />
        </div>

        {/* Input Snapshot Toggle */}
        <button
          onClick={() => setShowSnapshot(!showSnapshot)}
          className="flex items-center justify-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors py-1 shrink-0"
        >
          <span>View Exact Input Snapshot</span>
          {showSnapshot ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expanded Input Snapshot Details */}
      {showSnapshot && (
        <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 text-xs space-y-3">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Stateless Snapshot Used in Run #{result.runNumber}
          </div>

          <div>
            <span className="text-[11px] font-medium text-slate-400">Attached Files ({result.filesSnapshot?.length || 0}):</span>
            <div className="flex gap-1.5 mt-1 flex-wrap">
              {result.filesSnapshot?.length === 0 ? (
                <span className="text-slate-600 text-[11px]">No files attached</span>
              ) : (
                result.filesSnapshot?.map((f, i) => (
                  <span
                    key={i}
                    className="text-[10px] bg-slate-900 border border-slate-800 text-indigo-300 px-2 py-0.5 rounded font-mono truncate max-w-full"
                  >
                    {f.name}
                  </span>
                ))
              )}
            </div>
          </div>

          {result.systemPromptSnapshot && (
            <div>
              <span className="text-[11px] font-medium text-slate-400">System Instruction Snapshot:</span>
              <pre className="mt-1 p-2 rounded bg-slate-900 border border-slate-800/80 font-mono text-[10px] text-slate-300 max-h-32 overflow-y-auto whitespace-pre-wrap break-words">
                {result.systemPromptSnapshot}
              </pre>
            </div>
          )}

          <div>
            <span className="text-[11px] font-medium text-slate-400">Human Prompt Snapshot:</span>
            <pre className="mt-1 p-2 rounded bg-slate-900 border border-slate-800/80 font-mono text-[10px] text-slate-300 max-h-32 overflow-y-auto whitespace-pre-wrap break-words">
              {result.humanPromptSnapshot}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
