import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  Copy,
  Download,
  Upload,
  BookOpen,
  ChevronDown,
  Layers,
  CheckCircle2,
  Trash2,
  Menu,
  X
} from 'lucide-react';
import { PromptTester } from '../types/prompt';

interface HeaderProps {
  testers: PromptTester[];
  activeTesterId: string;
  onSelectTester: (id: string) => void;
  onCreateNewTester: () => void;
  onCloneTester: () => void;
  onDeleteTester: (id: string) => void;
  onExportTesters: () => void;
  onImportTesters: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenTemplates: () => void;
  totalRuns: number;
}

export const Header: React.FC<HeaderProps> = ({
  testers,
  activeTesterId,
  onSelectTester,
  onCreateNewTester,
  onCloneTester,
  onDeleteTester,
  onExportTesters,
  onImportTesters,
  onOpenTemplates,
  totalRuns,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const activeTester = testers.find((t) => t.id === activeTesterId) || testers[0];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between select-none relative z-40">
      {/* Brand & Project Identity */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="font-bold tracking-tight text-slate-100 text-sm sm:text-base">PromptLab</span>
            <span className="text-[9px] sm:text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              Fresh
            </span>
          </div>
          <p className="text-[10px] text-slate-400 hidden md:block">Zero-context isolated prompt testing</p>
        </div>

        {/* Separator */}
        <div className="h-5 w-px bg-slate-800 mx-1 hidden sm:block" />

        {/* Prompt Tester Dropdown Selector */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 sm:gap-2 bg-slate-800/90 hover:bg-slate-700/80 text-slate-200 px-2.5 sm:px-3 py-1.5 rounded-md border border-slate-700 text-xs font-medium transition-all shadow-sm max-w-[140px] xs:max-w-[180px] sm:max-w-xs"
            title="Switch or manage prompt testers"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="truncate text-[11px] sm:text-xs">{activeTester?.name || 'Select Tester'}</span>
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0 ml-0.5" />
          </button>

          {dropdownOpen && (
            <div
              className="absolute left-0 top-full mt-1.5 w-[280px] sm:w-80 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl py-1.5 z-50 divide-y divide-slate-800 text-xs"
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex justify-between items-center">
                <span>Prompt Testers ({testers.length})</span>
                <span className="text-slate-500">Pick to edit & run</span>
              </div>
              <div className="max-h-60 overflow-y-auto py-1">
                {testers.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      onSelectTester(t.id);
                      setDropdownOpen(false);
                    }}
                    className={`px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-slate-800/70 transition-colors ${
                      t.id === activeTesterId ? 'bg-indigo-950/40 text-indigo-300 font-medium' : 'text-slate-300'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="truncate text-xs">{t.name}</div>
                      <div className="text-[10px] text-slate-500 truncate">{t.description || 'No description'}</div>
                    </div>
                    {t.id === activeTesterId ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    ) : testers.length > 1 ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete tester "${t.name}"?`)) {
                            onDeleteTester(t.id);
                          }
                        }}
                        className="text-slate-500 hover:text-red-400 p-1 rounded"
                        title="Delete tester"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
              <div className="p-1.5 bg-slate-950/50 flex gap-1">
                <button
                  onClick={() => {
                    onCreateNewTester();
                    setDropdownOpen(false);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[11px] transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  New Tester
                </button>
                <button
                  onClick={() => {
                    onCloneTester();
                    setDropdownOpen(false);
                  }}
                  className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors"
                  title="Duplicate active prompt tester"
                >
                  <Copy className="w-3 h-3" />
                  Clone
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Center Actions: Library & Quick Helpers */}
      <div className="hidden lg:flex items-center gap-2">
        <button
          onClick={onOpenTemplates}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs border border-slate-700/80 transition-colors"
          title="Explore pre-built prompt testing presets"
        >
          <BookOpen className="w-3.5 h-3.5 text-amber-400" />
          <span>Preset Library</span>
        </button>
      </div>

      {/* Right Controls: Desktop & Mobile */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Total Fresh Runs Count */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800/70 border border-slate-700/60 text-[11px] sm:text-xs text-slate-300">
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-400 hidden xs:inline">Fresh Runs:</span>
          <span className="font-semibold text-slate-200">{totalRuns}</span>
        </div>

        {/* Desktop Export / Import */}
        <div className="hidden sm:flex items-center gap-1">
          <button
            onClick={onExportTesters}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Export all testers to JSON"
          >
            <Download className="w-4 h-4" />
          </button>
          <label
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer transition-colors"
            title="Import testers from JSON"
          >
            <Upload className="w-4 h-4" />
            <input
              type="file"
              accept=".json"
              onChange={onImportTesters}
              className="hidden"
            />
          </label>
        </div>

        {/* Mobile Menu Button (< sm) */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="sm:hidden p-1.5 rounded hover:bg-slate-800 text-slate-300 transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* Mobile Actions Drawer / Modal */}
      {mobileMenuOpen && (
        <div className="sm:hidden absolute top-full left-0 right-0 bg-slate-900 border-b border-slate-800 p-3 shadow-2xl flex flex-col gap-2 z-50">
          <button
            onClick={() => {
              onOpenTemplates();
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 text-slate-200 text-xs font-medium"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>Browse Preset Library</span>
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => {
                onExportTesters();
                setMobileMenuOpen(false);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 text-slate-200 text-xs font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
            <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 text-slate-200 text-xs font-medium cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Import JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={(e) => {
                  onImportTesters(e);
                  setMobileMenuOpen(false);
                }}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex gap-2 pt-1 border-t border-slate-800">
            <button
              onClick={() => {
                onCreateNewTester();
                setMobileMenuOpen(false);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Tester</span>
            </button>
            <button
              onClick={() => {
                onCloneTester();
                setMobileMenuOpen(false);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Clone Active</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
