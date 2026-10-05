import React, { useState } from 'react';
import { CheckSquare, Plus, Trash2, ShieldCheck, AlertCircle } from 'lucide-react';
import { PromptTester, AssertionRule } from '../types/prompt';

interface AssertionsManagerProps {
  tester: PromptTester;
  onChange: (updated: Partial<PromptTester>) => void;
}

export const AssertionsManager: React.FC<AssertionsManagerProps> = ({ tester, onChange }) => {
  const [ruleType, setRuleType] = useState<AssertionRule['type']>('contains');
  const [ruleVal, setRuleVal] = useState('');
  const [ruleDesc, setRuleDesc] = useState('');

  const handleAddRule = () => {
    if (ruleType !== 'is_json' && !ruleVal.trim()) return;

    const newRule: AssertionRule = {
      id: `rule-${Date.now()}`,
      type: ruleType,
      value: ruleVal.trim(),
      enabled: true,
      description: ruleDesc.trim() || undefined,
    };

    onChange({
      assertions: [...(tester.assertions || []), newRule],
    });

    setRuleVal('');
    setRuleDesc('');
  };

  const handleToggleRule = (id: string) => {
    onChange({
      assertions: (tester.assertions || []).map((r) =>
        r.id === id ? { ...r, enabled: !r.enabled } : r
      ),
    });
  };

  const handleDeleteRule = (id: string) => {
    onChange({
      assertions: (tester.assertions || []).filter((r) => r.id !== id),
    });
  };

  const getRuleLabel = (rule: AssertionRule) => {
    switch (rule.type) {
      case 'is_json':
        return 'Output must be parseable JSON';
      case 'contains':
        return `Must contain: "${rule.value}"`;
      case 'not_contains':
        return `Must NOT contain: "${rule.value}"`;
      case 'max_latency':
        return `Latency ≤ ${rule.value}ms`;
      case 'min_length':
        return `Length ≥ ${rule.value} chars`;
      case 'regex':
        return `Matches regex: /${rule.value}/`;
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          Automated Test Assertions ({tester.assertions?.length || 0})
        </span>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Define assertions to automatically validate each fresh test result against criteria
        </p>
      </div>

      {/* Add New Assertion */}
      <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <select
            value={ruleType}
            onChange={(e) => setRuleType(e.target.value as any)}
            className="bg-slate-950/80 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="contains">Contains substring</option>
            <option value="not_contains">Must NOT contain</option>
            <option value="is_json">Is Valid JSON</option>
            <option value="max_latency">Max Latency (ms)</option>
            <option value="min_length">Min Length (chars)</option>
            <option value="regex">Regex Pattern</option>
          </select>

          {ruleType !== 'is_json' ? (
            <input
              type="text"
              placeholder={
                ruleType === 'max_latency'
                  ? 'e.g. 2500'
                  : ruleType === 'min_length'
                  ? 'e.g. 50'
                  : 'Expected value or keyword'
              }
              value={ruleVal}
              onChange={(e) => setRuleVal(e.target.value)}
              className="bg-slate-950/80 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
            />
          ) : (
            <div className="text-xs text-slate-400 flex items-center px-2 bg-slate-950/50 rounded border border-slate-800">
              Validates JSON schema syntax
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Rule description (optional)"
              value={ruleDesc}
              onChange={(e) => setRuleDesc(e.target.value)}
              className="flex-1 bg-slate-950/80 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={handleAddRule}
              className="px-3.5 py-1.5 min-h-[38px] rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> Add Rule
            </button>
          </div>
        </div>
      </div>

      {/* Rules List */}
      {(!tester.assertions || tester.assertions.length === 0) ? (
        <div className="p-4 rounded-lg bg-slate-900/30 border border-slate-800/60 text-slate-500 text-xs text-center">
          No automated assertions set up. Add rules above to have PromptLab automatically grade each fresh test run.
        </div>
      ) : (
        <div className="space-y-2">
          {tester.assertions.map((rule) => (
            <div
              key={rule.id}
              className={`p-2.5 rounded-lg border transition-all flex items-center justify-between gap-3 ${
                rule.enabled
                  ? 'bg-slate-900/70 border-slate-800'
                  : 'bg-slate-950/40 border-slate-900 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={rule.enabled}
                  onChange={() => handleToggleRule(rule.id)}
                  className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                />
                <div>
                  <div className="text-xs font-medium text-slate-200 flex items-center gap-2">
                    <span className="font-mono text-emerald-400">{getRuleLabel(rule)}</span>
                  </div>
                  {rule.description && (
                    <div className="text-[11px] text-slate-400 mt-0.5">{rule.description}</div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDeleteRule(rule.id)}
                className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
                title="Delete assertion"
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
