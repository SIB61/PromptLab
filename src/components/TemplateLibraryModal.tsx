import React from 'react';
import { X, Sparkles, ArrowRight } from 'lucide-react';
import { PromptTester } from '../types/prompt';
import { INITIAL_TESTERS } from '../utils/sampleData';

interface TemplateLibraryModalProps {
  onSelectTemplate: (template: PromptTester) => void;
  onClose: () => void;
}

export const TemplateLibraryModal: React.FC<TemplateLibraryModalProps> = ({
  onSelectTemplate,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-3xl w-full flex flex-col overflow-hidden max-h-[92dvh]">
        {/* Header */}
        <div className="px-4 py-3 sm:px-5 sm:py-4 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" />
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-slate-100">
                Prompt Tester Presets & Templates
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-400">
                Quick-start with production-ready prompt setups containing sample files, rules, and assertions
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Templates Grid */}
        <div className="p-3 sm:p-5 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {INITIAL_TESTERS.map((tpl) => (
            <div
              key={tpl.id}
              className="bg-slate-950/60 border border-slate-800 hover:border-indigo-500/60 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between transition-all group hover:shadow-lg hover:shadow-indigo-950/30"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {tpl.category || 'General'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {tpl.inputFiles.length} file attached
                  </span>
                </div>

                <h4 className="text-xs sm:text-sm font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors">
                  {tpl.name}
                </h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {tpl.description}
                </p>

                <div className="mt-3 text-[11px] space-y-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                  <div className="text-slate-400 flex items-center justify-between">
                    <span>Model:</span>
                    <span className="text-slate-200 font-mono font-medium">{tpl.model}</span>
                  </div>
                  <div className="text-slate-400 flex items-center justify-between">
                    <span>Temp:</span>
                    <span className="text-slate-200 font-mono">{tpl.temperature}</span>
                  </div>
                  <div className="text-slate-400 flex items-center justify-between">
                    <span>Assertions:</span>
                    <span className="text-emerald-400 font-mono font-medium">{tpl.assertions.length} rules</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onSelectTemplate(tpl);
                  onClose();
                }}
                className="mt-3 sm:mt-4 w-full min-h-[38px] py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <span>Load Preset Tester</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 sm:px-5 sm:py-3 bg-slate-800/40 border-t border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
