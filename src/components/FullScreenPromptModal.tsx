import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Bot,
  User,
  Zap,
  Braces,
  Type,
  CheckCircle2
} from 'lucide-react';
import { estimateTokens, extractVariables } from '../utils/tokenEstimator';

interface FullScreenPromptModalProps {
  type: 'system' | 'human';
  title: string;
  value: string;
  onChange: (newValue: string) => void;
  onClose: () => void;
  snippets?: { label: string; text: string }[];
  availableVariables?: Record<string, string>;
  onRunTest?: () => void;
}

export const FullScreenPromptModal: React.FC<FullScreenPromptModalProps> = ({
  type,
  title,
  value,
  onChange,
  onClose,
  snippets = [],
  availableVariables = {},
  onRunTest,
}) => {
  const [copied, setCopied] = useState(false);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');
  const [isMono, setIsMono] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea when modal opens
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Keyboard shortcut listener: Esc to close, Cmd+Enter to run test
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (onRunTest) {
          e.preventDefault();
          onClose();
          onRunTest();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onRunTest]);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInsertAtCursor = (textToInsert: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange(value + textToInsert);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = value.substring(0, start);
    const after = value.substring(end);
    const updated = before + textToInsert + after;
    onChange(updated);

    // Reposition cursor after inserted text
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + textToInsert.length, start + textToInsert.length);
    }, 0);
  };

  const estimatedTokens = estimateTokens(value);
  const charCount = value.length;
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const lineCount = value ? value.split('\n').length : 1;
  const detectedVars = extractVariables(value);

  const fontSizeClass =
    fontSize === 'sm'
      ? 'text-xs sm:text-sm'
      : fontSize === 'base'
      ? 'text-sm sm:text-base'
      : 'text-base sm:text-lg';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col p-2 sm:p-5 select-none animate-in fade-in duration-150">
      <div className="w-full h-full max-w-7xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Top Header */}
        <div className="px-4 sm:px-6 py-3 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 ${
                type === 'system'
                  ? 'bg-violet-500/20 text-violet-400'
                  : 'bg-indigo-500/20 text-indigo-400'
              }`}
            >
              {type === 'system' ? <Bot className="w-4 h-4 sm:w-4.5 sm:h-4.5" /> : <User className="w-4 h-4 sm:w-4.5 sm:h-4.5" />}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-100 truncate">
                  Full Screen Editor: {title}
                </h2>
                <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hidden xs:inline">
                  Distraction Free
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                All changes sync automatically. Press <kbd className="px-1 py-0.2 bg-slate-800 rounded text-slate-300 font-mono">Esc</kbd> when finished.
              </p>
            </div>
          </div>

          {/* Quick Toolbar Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Font size toggles */}
            <div className="flex bg-slate-950/70 p-0.5 rounded-lg border border-slate-800 text-xs hidden sm:flex">
              <button
                type="button"
                onClick={() => setFontSize('sm')}
                className={`px-2 py-0.5 rounded ${fontSize === 'sm' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'}`}
                title="Small font"
              >
                A-
              </button>
              <button
                type="button"
                onClick={() => setFontSize('base')}
                className={`px-2 py-0.5 rounded ${fontSize === 'base' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'}`}
                title="Standard font"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setFontSize('lg')}
                className={`px-2 py-0.5 rounded ${fontSize === 'lg' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'}`}
                title="Large font"
              >
                A+
              </button>
            </div>

            {/* Font family toggle */}
            <button
              type="button"
              onClick={() => setIsMono(!isMono)}
              className={`p-1.5 rounded-lg border text-xs transition-colors hidden sm:flex items-center gap-1 ${
                isMono
                  ? 'bg-slate-800 border-slate-700 text-slate-200 font-mono'
                  : 'bg-slate-950/50 border-slate-800 text-slate-400 font-sans'
              }`}
              title="Toggle monospace font"
            >
              <Type className="w-3.5 h-3.5" />
              <span>{isMono ? 'Mono' : 'Sans'}</span>
            </button>

            {/* Copy button */}
            <button
              type="button"
              onClick={handleCopy}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700"
              title="Copy prompt text"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
            </button>

            {/* Clear button */}
            <button
              type="button"
              onClick={() => {
                if (confirm('Clear all text in this editor?')) {
                  onChange('');
                }
              }}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-red-400 transition-colors"
              title="Clear all"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Close Modal button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Close full-screen editor (Esc)"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Snippets & Variable Helpers Bar */}
        <div className="px-4 sm:px-6 py-2 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between gap-3 overflow-x-auto no-scrollbar shrink-0 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            {snippets.length > 0 && (
              <>
                <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium shrink-0">
                  <Zap className="w-3 h-3 text-amber-400" /> Insert Snippet:
                </span>
                {snippets.map((snip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleInsertAtCursor(snip.text)}
                    className="text-[11px] bg-slate-800/80 hover:bg-slate-700 active:bg-slate-600 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700/60 transition-colors whitespace-nowrap shrink-0"
                  >
                    + {snip.label}
                  </button>
                ))}
              </>
            )}

            {Object.keys(availableVariables).length > 0 && (
              <>
                <span className="text-slate-700 mx-1">|</span>
                <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium shrink-0">
                  <Braces className="w-3 h-3 text-indigo-400" /> Insert Variable:
                </span>
                {Object.keys(availableVariables).map((vKey) => (
                  <button
                    key={vKey}
                    type="button"
                    onClick={() => handleInsertAtCursor(`{{${vKey}}}`)}
                    className="text-[11px] bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800/50 font-mono shrink-0"
                  >
                    {`{{${vKey}}}`}
                  </button>
                ))}
              </>
            )}
          </div>

          {/* Metrics summary */}
          <div className="hidden md:flex items-center gap-3 text-slate-400 text-xs shrink-0 font-mono">
            <span>{lineCount} lines</span>
            <span>•</span>
            <span>{wordCount} words</span>
            <span>•</span>
            <span>{charCount} chars</span>
            <span>•</span>
            <span className="text-indigo-400 font-semibold">~{estimatedTokens} tokens</span>
          </div>
        </div>

        {/* Main Textarea Area */}
        <div className="flex-1 p-3 sm:p-6 bg-slate-950 overflow-hidden flex flex-col">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={
              type === 'system'
                ? "Define the model's system role, constraints, formatting rules, and behavioral boundaries..."
                : "Type or paste your prompt query or task here..."
            }
            className={`w-full flex-1 bg-transparent text-slate-100 placeholder-slate-600 focus:outline-none resize-none leading-relaxed p-2 selection:bg-indigo-600/40 select-text ${fontSizeClass} ${
              isMono ? 'font-mono' : 'font-sans'
            }`}
            autoFocus
          />
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-3 bg-slate-800/40 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">~{estimatedTokens}</span> estimated tokens
            <span className="text-slate-600">•</span>
            <span>{charCount} characters</span>
            <span className="hidden sm:inline text-slate-500">
              (Live-synced with test runner)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onRunTest && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRunTest();
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
              >
                <span>Run Fresh Test</span>
                <span className="text-[10px] text-slate-400 font-mono hidden md:inline">⌘+Enter</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 sm:px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Done Editing</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
