import React from 'react';
import { Sliders, Cpu, Brain, FileJson, Gauge } from 'lucide-react';
import { PromptTester } from '../types/prompt';

interface ModelSettingsProps {
  tester: PromptTester;
  onChange: (updated: Partial<PromptTester>) => void;
}

const MODELS = [
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    desc: 'High availability, near-instant response, optimal for prompt testing',
    badge: 'Recommended',
  },
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    desc: 'Deep reasoning, advanced extraction (auto-falls back if high demand)',
    badge: 'Flagship',
  },
  {
    id: 'gemini-flash-latest',
    name: 'Gemini Flash Latest',
    desc: 'General purpose model with standard throughput',
    badge: 'Standard',
  },
];

export const ModelSettings: React.FC<ModelSettingsProps> = ({ tester, onChange }) => {
  return (
    <div className="space-y-5">
      {/* Model Selection */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          Model Architecture
        </label>
        <div className="grid grid-cols-1 gap-2">
          {MODELS.map((m) => (
            <div
              key={m.id}
              onClick={() => onChange({ model: m.id })}
              className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                tester.model === m.id
                  ? 'bg-indigo-950/40 border-indigo-500/80 shadow-md ring-1 ring-indigo-500/50'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-200">{m.name}</span>
                  <span
                    className={`text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded border ${
                      tester.model === m.id
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {m.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">{m.desc}</p>
              </div>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  tester.model === m.id
                    ? 'border-indigo-500 bg-indigo-600'
                    : 'border-slate-600 bg-slate-800'
                }`}
              >
                {tester.model === m.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Temperature */}
      <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-amber-400" />
            Temperature: <span className="text-indigo-400 font-mono text-sm">{tester.temperature}</span>
          </label>
          <span className="text-[11px] text-slate-400">
            {tester.temperature === 0
              ? 'Deterministic'
              : tester.temperature < 0.4
              ? 'Precise & Structured'
              : tester.temperature < 0.9
              ? 'Balanced'
              : 'High Variety & Creative'}
          </span>
        </div>

        <input
          type="range"
          min="0"
          max="2"
          step="0.05"
          value={tester.temperature}
          onChange={(e) => onChange({ temperature: parseFloat(e.target.value) })}
          className="w-full accent-indigo-500 cursor-pointer"
        />

        {/* Presets */}
        <div className="grid grid-cols-2 xs:grid-cols-4 gap-1.5 pt-1">
          {[
            { label: '0.0 Strict', val: 0.0 },
            { label: '0.2 JSON', val: 0.2 },
            { label: '0.7 Balanced', val: 0.7 },
            { label: '1.2 Creative', val: 1.2 },
          ].map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => onChange({ temperature: preset.val })}
              className={`text-[11px] py-1.5 px-2 rounded-lg border transition-colors ${
                tester.temperature === preset.val
                  ? 'bg-indigo-600 text-white border-indigo-500 font-medium'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200 hover:bg-slate-700'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Response Format & Thinking Config */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Response Format */}
        <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-800 space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <FileJson className="w-3.5 h-3.5 text-emerald-400" />
            Response Format
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onChange({ responseFormat: 'text' })}
              className={`flex-1 py-1.5 text-xs rounded border transition-all ${
                tester.responseFormat === 'text'
                  ? 'bg-indigo-600 text-white border-indigo-500 font-medium'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              Text / Markdown
            </button>
            <button
              type="button"
              onClick={() => onChange({ responseFormat: 'json' })}
              className={`flex-1 py-1.5 text-xs rounded border transition-all ${
                tester.responseFormat === 'json'
                  ? 'bg-emerald-600 text-white border-emerald-500 font-medium'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              Structured JSON
            </button>
          </div>
          <p className="text-[10px] text-slate-500">
            {tester.responseFormat === 'json'
              ? 'Model is enforced via responseMimeType to emit valid JSON'
              : 'Freeform text, markdown headers, and code blocks'}
          </p>
        </div>

        {/* Thinking Level */}
        <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-800 space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5 text-violet-400" />
            Thinking Reasoning Level
          </label>
          <select
            value={tester.thinkingLevel || 'AUTO'}
            onChange={(e) => onChange({ thinkingLevel: e.target.value as any })}
            className="w-full bg-slate-950/80 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="AUTO">AUTO (Dynamic by task)</option>
            <option value="LOW">LOW (Minimize latency)</option>
            <option value="HIGH">HIGH (Max reasoning)</option>
            <option value="MINIMAL">MINIMAL (No extra thoughts)</option>
          </select>
          <p className="text-[10px] text-slate-500">
            Controls internal chain-of-thought depth for Gemini 3 models
          </p>
        </div>
      </div>
    </div>
  );
};
