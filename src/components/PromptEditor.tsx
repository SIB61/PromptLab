import React, { useState } from 'react';
import {
  Bot,
  User,
  Braces,
  Copy,
  Check,
  RotateCcw,
  Zap,
  Maximize2
} from 'lucide-react';
import { PromptTester } from '../types/prompt';
import { estimateTokens, extractVariables } from '../utils/tokenEstimator';
import { FullScreenPromptModal } from './FullScreenPromptModal';

interface PromptEditorProps {
  tester: PromptTester;
  onChange: (updated: Partial<PromptTester>) => void;
  onRunTest?: () => void;
}

const SYSTEM_SNIPPETS = [
  { label: 'Strict JSON', text: '\n\nIMPORTANT: Return ONLY a valid JSON object. No explanations, no markdown fences.' },
  { label: 'Chain of Thought', text: '\n\nThink step-by-step before arriving at the final conclusion.' },
  { label: 'Executive Brevity', text: '\n\nBe extremely concise. Use tight bullet points and zero conversational filler.' },
  { label: 'Cite Quotes', text: '\n\nWhenever making claims about the attached input files, quote the exact line or text.' },
];

export const PromptEditor: React.FC<PromptEditorProps> = ({ tester, onChange, onRunTest }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [fullScreenModal, setFullScreenModal] = useState<'system' | 'human' | null>(null);

  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 1800);
  };

  const sysTokens = estimateTokens(tester.systemPrompt);
  const humanTokens = estimateTokens(tester.humanPrompt);
  const detectedVars = extractVariables(`${tester.systemPrompt} ${tester.humanPrompt}`);

  return (
    <div className="space-y-4 pb-2">
      {/* Tester Meta: Name & Description */}
      <div className="bg-slate-900/80 p-3 sm:p-3.5 rounded-xl border border-slate-800">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Tester Name & Objective
            </label>
            <span className="text-[11px] text-slate-500 hidden sm:inline">Configured for your system</span>
          </div>
          <input
            type="text"
            value={tester.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="e.g. Customer Support Classifier, Code Reviewer"
            className="w-full bg-slate-950 border border-slate-700/80 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
          />
          <input
            type="text"
            value={tester.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="Short description of what this prompt test verifies..."
            className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500/70 rounded-lg px-3 py-1.5 text-xs text-slate-400 placeholder-slate-600 focus:outline-none"
          />
        </div>
      </div>

      {/* System Prompt Section */}
      <div className="bg-slate-900/80 rounded-xl border border-slate-800 overflow-hidden flex flex-col">
        {/* Section Header */}
        <div className="px-3 sm:px-3.5 py-2.5 bg-slate-800/50 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-violet-500/20 text-violet-400 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold text-slate-200">System Prompt</span>
            <span className="text-[10px] text-slate-400 px-1.5 py-0.2 rounded bg-slate-800 hidden xs:inline">
              Role & Rules
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 text-xs">
            <span className="text-slate-400 text-[11px]">
              ~{sysTokens} tokens
            </span>

            {/* Full Screen Modal Button */}
            <button
              type="button"
              onClick={() => setFullScreenModal('system')}
              className="flex items-center gap-1 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 px-2 py-1 rounded-md transition-colors border border-slate-700 text-[11px] font-medium"
              title="Open full screen editor modal"
            >
              <Maximize2 className="w-3 h-3 text-violet-400" />
              <span>Full Screen</span>
            </button>

            <button
              type="button"
              onClick={() => handleCopy(tester.systemPrompt, 'system')}
              className="text-slate-400 hover:text-slate-200 p-1.5 rounded hover:bg-slate-800 transition-colors"
              title="Copy system prompt"
            >
              {copiedSection === 'system' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => onChange({ systemPrompt: '' })}
              className="text-slate-500 hover:text-slate-300 p-1.5 rounded hover:bg-slate-800 text-[11px] transition-colors"
              title="Clear system prompt"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* System Textarea */}
        <div className="p-3">
          <textarea
            value={tester.systemPrompt}
            onChange={(e) => onChange({ systemPrompt: e.target.value })}
            placeholder="Define the model's persona, strict rules, output format, or constraints (e.g. 'You are an expert customer triage engineer. Follow these guidelines...')"
            rows={6}
            className="w-full min-h-[130px] sm:min-h-[140px] bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono resize-y leading-relaxed"
          />

          {/* Quick Snippets & Expand link */}
          <div className="mt-2.5 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-0.5">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] text-slate-500 flex items-center gap-1 shrink-0">
                <Zap className="w-3 h-3 text-amber-400" /> Quick Add:
              </span>
              {SYSTEM_SNIPPETS.map((snip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onChange({ systemPrompt: tester.systemPrompt + snip.text })}
                  className="text-[11px] bg-slate-800/90 hover:bg-slate-700 active:bg-slate-600 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700/60 transition-colors shrink-0 whitespace-nowrap"
                >
                  + {snip.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setFullScreenModal('system')}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 shrink-0 ml-auto"
            >
              <Maximize2 className="w-3 h-3" />
              <span>Full Screen</span>
            </button>
          </div>
        </div>
      </div>

      {/* Human Prompt Section */}
      <div className="bg-slate-900/80 rounded-xl border border-slate-800 overflow-hidden flex flex-col">
        {/* Section Header */}
        <div className="px-3 sm:px-3.5 py-2.5 bg-slate-800/50 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <User className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold text-slate-200">Human Prompt (User Input)</span>
            <span className="text-[10px] text-slate-400 px-1.5 py-0.2 rounded bg-slate-800 hidden xs:inline">
              Task
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 text-xs">
            <span className="text-slate-400 text-[11px]">
              ~{humanTokens} tokens
            </span>

            {/* Full Screen Modal Button */}
            <button
              type="button"
              onClick={() => setFullScreenModal('human')}
              className="flex items-center gap-1 text-slate-200 hover:text-white bg-indigo-600/90 hover:bg-indigo-500 px-2.5 py-1 rounded-md transition-colors text-[11px] font-semibold shadow-sm"
              title="Open full screen editor modal"
            >
              <Maximize2 className="w-3 h-3 text-white" />
              <span>Full Screen</span>
            </button>

            <button
              type="button"
              onClick={() => handleCopy(tester.humanPrompt, 'human')}
              className="text-slate-400 hover:text-slate-200 p-1.5 rounded hover:bg-slate-800 transition-colors"
              title="Copy human prompt"
            >
              {copiedSection === 'human' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => onChange({ humanPrompt: '' })}
              className="text-slate-500 hover:text-slate-300 p-1.5 rounded hover:bg-slate-800 text-[11px] transition-colors"
              title="Clear human prompt"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Human Prompt Textarea */}
        <div className="p-3">
          <textarea
            value={tester.humanPrompt}
            onChange={(e) => onChange({ humanPrompt: e.target.value })}
            placeholder="Enter the human/user prompt to test (e.g. 'Classify the attached customer ticket and return the urgent action items.')"
            rows={5}
            className="w-full min-h-[120px] sm:min-h-[130px] bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono resize-y leading-relaxed"
          />

          <div className="mt-2.5 flex items-center justify-between gap-2 flex-wrap">
            {/* Detected or available variable tags */}
            {detectedVars.length > 0 ? (
              <div className="flex items-center gap-1.5 flex-wrap bg-slate-950/60 p-1.5 rounded-lg border border-slate-800/80">
                <span className="text-[10px] text-indigo-400 flex items-center gap-1 font-medium">
                  <Braces className="w-3 h-3" /> Detected Variables:
                </span>
                {detectedVars.map((v) => (
                  <span
                    key={v}
                    className="text-[10px] bg-indigo-950/70 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800/60 font-mono"
                  >
                    {`{{${v}}}`}
                  </span>
                ))}
              </div>
            ) : <div />}

            <button
              type="button"
              onClick={() => setFullScreenModal('human')}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 ml-auto"
            >
              <Maximize2 className="w-3 h-3" />
              <span>Full Screen Editor</span>
            </button>
          </div>
        </div>
      </div>

      {/* Full Screen Prompt Modal */}
      {fullScreenModal && (
        <FullScreenPromptModal
          type={fullScreenModal}
          title={fullScreenModal === 'system' ? 'System Prompt' : 'Human Prompt (User Input)'}
          value={fullScreenModal === 'system' ? tester.systemPrompt : tester.humanPrompt}
          onChange={(newVal) => {
            if (fullScreenModal === 'system') {
              onChange({ systemPrompt: newVal });
            } else {
              onChange({ humanPrompt: newVal });
            }
          }}
          onClose={() => setFullScreenModal(null)}
          snippets={fullScreenModal === 'system' ? SYSTEM_SNIPPETS : []}
          availableVariables={tester.variables}
          onRunTest={onRunTest}
        />
      )}
    </div>
  );
};
