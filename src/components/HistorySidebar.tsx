import React, { useState } from 'react';
import {
  History,
  Trash2,
  Clock,
  Zap,
  CheckCircle2,
  XCircle,
  ThumbsUp,
  ThumbsDown,
  Search,
  Filter,
  Columns2
} from 'lucide-react';
import { TestResult } from '../types/prompt';
import { formatDuration } from '../utils/tokenEstimator';

interface HistorySidebarProps {
  results: TestResult[];
  selectedResultId: string | null;
  onSelectResult: (id: string) => void;
  onClearHistory: () => void;
  onOpenCompare: () => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  results,
  selectedResultId,
  onSelectResult,
  onClearHistory,
  onOpenCompare,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState<'all' | 'up' | 'down'>('all');

  const filteredResults = results.filter((r) => {
    if (ratingFilter === 'up' && r.rating !== 'up') return false;
    if (ratingFilter === 'down' && r.rating !== 'down') return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const inOutput = r.output.toLowerCase().includes(term);
      const inName = r.testerName?.toLowerCase().includes(term);
      return inOutput || inName;
    }
    return true;
  });

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="px-3.5 py-3 bg-slate-800/50 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Fresh Run History ({results.length})
          </span>
        </div>

        <div className="flex items-center gap-1">
          {results.length >= 2 && (
            <button
              onClick={onOpenCompare}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-indigo-300 transition-colors"
              title="Compare runs side-by-side"
            >
              <Columns2 className="w-3.5 h-3.5" />
            </button>
          )}
          {results.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Clear all test history runs?')) {
                  onClearHistory();
                }
              }}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-500 hover:text-red-400 transition-colors"
              title="Clear all runs"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search */}
      <div className="p-2.5 border-b border-slate-800/80 bg-slate-950/40 space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search test output..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded pl-8 pr-2.5 py-1 text-xs text-slate-200 placeholder-slate-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>Filter:</span>
          <div className="flex gap-1">
            <button
              onClick={() => setRatingFilter('all')}
              className={`px-2 py-0.5 rounded transition-colors ${
                ratingFilter === 'all' ? 'bg-indigo-600 text-white font-medium' : 'hover:bg-slate-800 text-slate-400'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setRatingFilter('up')}
              className={`px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${
                ratingFilter === 'up' ? 'bg-emerald-600 text-white font-medium' : 'hover:bg-slate-800 text-slate-400'
              }`}
            >
              <ThumbsUp className="w-2.5 h-2.5" /> Up
            </button>
            <button
              onClick={() => setRatingFilter('down')}
              className={`px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${
                ratingFilter === 'down' ? 'bg-red-600 text-white font-medium' : 'hover:bg-slate-800 text-slate-400'
              }`}
            >
              <ThumbsDown className="w-2.5 h-2.5" /> Down
            </button>
          </div>
        </div>
      </div>

      {/* Run List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50 p-1">
        {filteredResults.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs">
            {results.length === 0
              ? 'No test runs yet. Run a prompt test to see fresh isolated results logged here.'
              : 'No results match search filters.'}
          </div>
        ) : (
          filteredResults.map((run) => {
            const isSelected = selectedResultId === run.id;
            const hasAssertions = run.assertionResults && run.assertionResults.length > 0;
            const allPassed = hasAssertions && run.assertionResults!.every((a) => a.passed);

            return (
              <div
                key={run.id}
                onClick={() => onSelectResult(run.id)}
                className={`p-2.5 rounded-lg cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-indigo-950/40 border border-indigo-500/50 shadow-sm'
                    : 'hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-400">
                      #{run.runNumber}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(run.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {run.rating === 'up' && <ThumbsUp className="w-3 h-3 text-emerald-400" />}
                    {run.rating === 'down' && <ThumbsDown className="w-3 h-3 text-red-400" />}
                    {hasAssertions && (
                      allPassed ? (
                        <span title="All assertions passed">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        </span>
                      ) : (
                        <span title="Some assertions failed">
                          <XCircle className="w-3 h-3 text-amber-400" />
                        </span>
                      )
                    )}
                  </div>
                </div>

                <div className="text-[11px] text-slate-300 font-medium truncate mt-1">
                  {run.output.slice(0, 75).trim() || 'Empty response'}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5">
                  <span className="flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5 text-amber-400" />
                    {formatDuration(run.durationMs)}
                  </span>
                  <span>{run.usage?.totalTokens || 0} tokens</span>
                  <span className="truncate max-w-[80px]">{run.model}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
