import React, { useState } from 'react';
import { Braces, Plus, Trash2, HelpCircle } from 'lucide-react';
import { PromptTester } from '../types/prompt';
import { extractVariables } from '../utils/tokenEstimator';

interface VariablesManagerProps {
  tester: PromptTester;
  onChange: (updated: Partial<PromptTester>) => void;
}

export const VariablesManager: React.FC<VariablesManagerProps> = ({ tester, onChange }) => {
  const [newKey, setNewKey] = useState('');
  const [newVal, setNewVal] = useState('');

  const detectedKeys = extractVariables(`${tester.systemPrompt} ${tester.humanPrompt}`);

  const handleAdd = () => {
    if (!newKey.trim()) return;
    const key = newKey.trim().replace(/[{}]/g, '');
    onChange({
      variables: {
        ...tester.variables,
        [key]: newVal,
      },
    });
    setNewKey('');
    setNewVal('');
  };

  const handleUpdate = (key: string, value: string) => {
    onChange({
      variables: {
        ...tester.variables,
        [key]: value,
      },
    });
  };

  const handleDelete = (key: string) => {
    const updated = { ...tester.variables };
    delete updated[key];
    onChange({ variables: updated });
  };

  const handleAutoPopulateDetected = () => {
    const current = { ...tester.variables };
    for (const key of detectedKeys) {
      if (!(key in current)) {
        current[key] = '';
      }
    }
    onChange({ variables: current });
  };

  const entries = Object.entries(tester.variables || {});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Braces className="w-3.5 h-3.5 text-indigo-400" />
            Prompt Variables ({entries.length})
          </span>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Use <code className="text-indigo-400 font-mono font-bold">{'{{var_name}}'}</code> placeholders in system or human prompt
          </p>
        </div>

        {detectedKeys.length > 0 && (
          <button
            type="button"
            onClick={handleAutoPopulateDetected}
            className="text-[11px] px-2.5 py-1 rounded bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 transition-colors"
          >
            Import Detected ({detectedKeys.length})
          </button>
        )}
      </div>

      {/* Add New Variable Input */}
      <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Variable key (e.g. user_tier)"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Value (e.g. Enterprise Tier 1)"
            value={newVal}
            onChange={(e) => setNewVal(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="w-full sm:w-auto px-4 py-2 min-h-[38px] rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add Variable
        </button>
      </div>

      {/* Variables List */}
      {entries.length === 0 ? (
        <div className="p-4 rounded-lg bg-slate-900/30 border border-slate-800/60 text-slate-500 text-xs text-center">
          No variables defined. You can insert dynamic values like <span className="font-mono text-indigo-400">{'{{environment}}'}</span> or <span className="font-mono text-indigo-400">{'{{company_name}}'}</span> into your prompts.
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map(([key, value]) => (
            <div
              key={key}
              className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2 flex-1">
                <span className="font-mono text-xs text-indigo-300 font-semibold px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-900/50">
                  {`{{${key}}}`}
                </span>
                <span className="text-slate-500 text-xs">=</span>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => handleUpdate(key, e.target.value)}
                  className="flex-1 bg-slate-950/70 border border-slate-800 focus:border-indigo-500 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => handleDelete(key)}
                className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
                title="Remove variable"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
