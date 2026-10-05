import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Sparkles,
  Layers,
  FileText,
  Sliders,
  Braces,
  ShieldCheck,
  Code2,
  Columns2,
  History,
  AlertCircle,
  Flame,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { PromptTester, TestResult } from './types/prompt';
import { INITIAL_TESTERS } from './utils/sampleData';
import { runAssertions } from './utils/assertions';
import { substituteVariables, estimateTokens } from './utils/tokenEstimator';

// Components
import { Header } from './components/Header';
import { PromptEditor } from './components/PromptEditor';
import { FilesManager } from './components/FilesManager';
import { ModelSettings } from './components/ModelSettings';
import { VariablesManager } from './components/VariablesManager';
import { AssertionsManager } from './components/AssertionsManager';
import { CodeExportModal } from './components/CodeExportModal';
import { ResultCard } from './components/ResultCard';
import { ResultsComparison } from './components/ResultsComparison';
import { HistorySidebar } from './components/HistorySidebar';
import { TemplateLibraryModal } from './components/TemplateLibraryModal';

const STORAGE_KEY_TESTERS = 'promptlab_testers_v1';
const STORAGE_KEY_RESULTS = 'promptlab_results_v1';

export default function App() {
  // Load saved testers or defaults
  const [testers, setTesters] = useState<PromptTester[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TESTERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load saved testers', e);
    }
    return INITIAL_TESTERS;
  });

  const [activeTesterId, setActiveTesterId] = useState<string>(() => {
    return testers[0]?.id || INITIAL_TESTERS[0].id;
  });

  // Load test results history
  const [results, setResults] = useState<TestResult[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RESULTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed to load saved results', e);
    }
    return [];
  });

  // Active configuration sub-tab
  const [activeTab, setActiveTab] = useState<'prompt' | 'files' | 'model' | 'variables' | 'assertions'>('prompt');

  // Mobile Top-Level View Switcher: 'setup' | 'results' | 'history'
  const [mobileView, setMobileView] = useState<'setup' | 'results' | 'history'>('setup');

  // UI Modals
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [compareRuns, setCompareRuns] = useState<{ runA?: TestResult; runB?: TestResult }>({});

  // Active selected result in main panel
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);

  // Execution states
  const [isRunning, setIsRunning] = useState(false);
  const [isMultiRunning, setIsMultiRunning] = useState(false);
  const [currentStreamOutput, setCurrentStreamOutput] = useState('');
  const [currentStreamDuration, setCurrentStreamDuration] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // References
  const timerRef = useRef<any>(null);

  // Save testers to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TESTERS, JSON.stringify(testers));
  }, [testers]);

  // Save results to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_RESULTS, JSON.stringify(results));
  }, [results]);

  const activeTester = testers.find((t) => t.id === activeTesterId) || testers[0];

  // Update active tester
  const handleUpdateTester = (updated: Partial<PromptTester>) => {
    setTesters((prev) =>
      prev.map((t) => (t.id === activeTester.id ? { ...t, ...updated, updatedAt: new Date().toISOString() } : t))
    );
  };

  // Create new tester
  const handleCreateNewTester = () => {
    const newTester: PromptTester = {
      id: `tester-${Date.now()}`,
      name: `Untitled Prompt Tester ${testers.length + 1}`,
      description: 'Configure system prompt, human prompt, and test files for fresh stateless verification.',
      systemPrompt: 'You are an intelligent assistant. Provide accurate and well-reasoned answers.',
      humanPrompt: 'Please review the attached information and provide a structured summary.',
      inputFiles: [],
      model: 'gemini-3.1-flash-lite',
      temperature: 0.7,
      topP: 0.95,
      responseFormat: 'text',
      thinkingLevel: 'AUTO',
      variables: {},
      assertions: [
        {
          id: `rule-${Date.now()}`,
          type: 'min_length',
          value: '20',
          enabled: true,
          description: 'Basic output verification (>20 chars)',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTesters([...testers, newTester]);
    setActiveTesterId(newTester.id);
    setActiveTab('prompt');
    setMobileView('setup');
  };

  // Clone tester
  const handleCloneTester = () => {
    const cloned: PromptTester = {
      ...activeTester,
      id: `tester-${Date.now()}`,
      name: `${activeTester.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTesters([...testers, cloned]);
    setActiveTesterId(cloned.id);
    setMobileView('setup');
  };

  // Delete tester
  const handleDeleteTester = (id: string) => {
    if (testers.length <= 1) {
      alert('You must keep at least one prompt tester.');
      return;
    }
    const remaining = testers.filter((t) => t.id !== id);
    setTesters(remaining);
    if (activeTesterId === id) {
      setActiveTesterId(remaining[0].id);
    }
  };

  // Export & Import
  const handleExportTesters = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(testers, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `promptlab-testers-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportTesters = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTesters(parsed);
          setActiveTesterId(parsed[0].id);
          alert(`Successfully imported ${parsed.length} prompt testers!`);
        }
      } catch (err) {
        alert('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Core Execution Logic: 100% Stateless Fresh Test Every Time!
  const executeFreshTest = async (tester: PromptTester): Promise<TestResult> => {
    const startTime = Date.now();
    const finalSystem = substituteVariables(tester.systemPrompt, tester.variables);
    const finalHuman = substituteVariables(tester.humanPrompt, tester.variables);
    const activeFiles = tester.inputFiles.filter((f) => f.enabled);

    const payload = {
      systemPrompt: finalSystem,
      humanPrompt: finalHuman,
      files: activeFiles.map((f) => ({
        name: f.name,
        type: f.type,
        size: f.size,
        content: f.content,
        isBase64: f.isBase64,
      })),
      model: tester.model || 'gemini-3.1-flash-lite',
      temperature: tester.temperature,
      topP: tester.topP,
      responseFormat: tester.responseFormat,
      thinkingLevel: tester.thinkingLevel,
    };

    const nextRunNumber = (results[0]?.runNumber || 0) + 1;

    try {
      let accumulatedOutput = '';
      let serverDoneData: any = null;
      let usedModel = tester.model || 'gemini-3.1-flash-lite';

      try {
        // Attempt SSE Streaming first for real-time responsiveness
        const response = await fetch('/api/test-prompt/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          let lineBuffer = '';

          if (reader) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              lineBuffer += decoder.decode(value, { stream: true });
              const lines = lineBuffer.split('\n');
              lineBuffer = lines.pop() || '';

              for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('data: ')) {
                  try {
                    const event = JSON.parse(trimmed.slice(6));
                    if (event.type === 'chunk' && event.text) {
                      accumulatedOutput += event.text;
                      setCurrentStreamOutput(accumulatedOutput);
                    } else if (event.type === 'done') {
                      serverDoneData = event;
                      if (event.model) usedModel = event.model;
                    }
                  } catch (parseErr) {
                    // Ignore transient chunk framing
                  }
                }
              }
            }
          }
        }
      } catch (streamErr) {
        console.warn('Stream failed or was interrupted, falling back to non-streaming:', streamErr);
      }

      // If streaming didn't produce full output, fallback directly to standard POST endpoint
      if (!accumulatedOutput.trim() && !serverDoneData?.output) {
        const postRes = await fetch('/api/test-prompt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!postRes.ok) {
          const errData = await postRes.json().catch(() => ({}));
          throw new Error(errData.error || `Server responded with ${postRes.status}`);
        }

        const postData = await postRes.json();
        if (postData.success) {
          accumulatedOutput = postData.output;
          usedModel = postData.model || usedModel;
          serverDoneData = {
            output: postData.output,
            durationMs: postData.durationMs,
            model: postData.model,
            usage: postData.usage,
            finishReason: postData.finishReason,
          };
        } else {
          throw new Error(postData.error || 'Test failed to generate output.');
        }
      }

      const totalDuration = Date.now() - startTime;
      const finalOutput = serverDoneData?.output || accumulatedOutput;

      // Evaluate assertions
      const assertionResults = runAssertions(
        finalOutput,
        serverDoneData?.durationMs || totalDuration,
        tester.assertions || []
      );

      const newResult: TestResult = {
        id: `run-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        runNumber: nextRunNumber,
        testerId: tester.id,
        testerName: tester.name,
        systemPromptSnapshot: finalSystem,
        humanPromptSnapshot: finalHuman,
        filesSnapshot: activeFiles.map((f) => ({ name: f.name, size: f.size, type: f.type })),
        model: usedModel,
        temperature: tester.temperature,
        topP: tester.topP,
        responseFormat: tester.responseFormat,
        output: finalOutput,
        durationMs: serverDoneData?.durationMs || totalDuration,
        finishReason: serverDoneData?.finishReason || 'STOP',
        usage: serverDoneData?.usage || {
          promptTokens: Math.ceil((finalSystem.length + finalHuman.length) / 4),
          candidatesTokens: Math.ceil(finalOutput.length / 4),
          totalTokens: Math.ceil((finalSystem.length + finalHuman.length + finalOutput.length) / 4),
        },
        timestamp: new Date().toISOString(),
        status: 'success',
        assertionResults,
      };

      return newResult;
    } catch (err: any) {
      const totalDuration = Date.now() - startTime;
      const errorResult: TestResult = {
        id: `run-${Date.now()}`,
        runNumber: nextRunNumber,
        testerId: tester.id,
        testerName: tester.name,
        systemPromptSnapshot: finalSystem,
        humanPromptSnapshot: finalHuman,
        filesSnapshot: activeFiles.map((f) => ({ name: f.name, size: f.size, type: f.type })),
        model: tester.model,
        temperature: tester.temperature,
        topP: tester.topP,
        responseFormat: tester.responseFormat,
        output: '',
        durationMs: totalDuration,
        usage: { promptTokens: 0, candidatesTokens: 0, totalTokens: 0 },
        timestamp: new Date().toISOString(),
        status: 'error',
        error: err.message || 'Execution failed',
      };
      return errorResult;
    }
  };

  // Run Single Fresh Test
  const handleRunFreshTest = async () => {
    if (isRunning) return;
    setErrorMessage(null);
    setIsRunning(true);
    setCurrentStreamOutput('');
    setCurrentStreamDuration(0);

    // On mobile, auto-switch to results so user sees live streaming response
    if (window.innerWidth < 1024) {
      setMobileView('results');
    }

    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      setCurrentStreamDuration(Date.now() - startTime);
    }, 100);

    try {
      const result = await executeFreshTest(activeTester);
      setResults((prev) => [result, ...prev]);
      setSelectedResultId(result.id);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to complete test run.');
    } finally {
      clearInterval(timerRef.current);
      setIsRunning(false);
      setCurrentStreamOutput('');
    }
  };

  // Multi-Run Benchmark (Run 3 independent fresh tests)
  const handleRunMultiBenchmark = async () => {
    if (isRunning || isMultiRunning) return;
    setIsMultiRunning(true);
    setErrorMessage(null);

    if (window.innerWidth < 1024) {
      setMobileView('results');
    }

    const newRuns: TestResult[] = [];
    try {
      for (let i = 1; i <= 3; i++) {
        setCurrentStreamOutput(`Executing Batch Fresh Test ${i} of 3...`);
        const result = await executeFreshTest(activeTester);
        newRuns.unshift(result);
        setResults((prev) => [result, ...prev]);
      }
      if (newRuns.length > 0) {
        setSelectedResultId(newRuns[0].id);
      }
    } catch (err: any) {
      setErrorMessage(`Multi-run halted: ${err.message}`);
    } finally {
      setIsMultiRunning(false);
      setCurrentStreamOutput('');
    }
  };

  // Keyboard shortcut: Cmd/Ctrl + Enter to run test
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRunFreshTest();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTester, isRunning, results]);

  const activeResult =
    results.find((r) => r.id === selectedResultId) ||
    results.find((r) => r.testerId === activeTester.id) ||
    results[0];

  const activeFilesCount = activeTester.inputFiles.filter((f) => f.enabled).length;
  const estimatedInputTokens =
    estimateTokens(activeTester.systemPrompt) +
    estimateTokens(activeTester.humanPrompt) +
    activeTester.inputFiles
      .filter((f) => f.enabled)
      .reduce((sum, f) => sum + (f.isBase64 ? 258 : estimateTokens(f.content)), 0);

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30 overflow-hidden">
      {/* Top Header */}
      <Header
        testers={testers}
        activeTesterId={activeTester.id}
        onSelectTester={(id) => {
          setActiveTesterId(id);
          setSelectedResultId(null);
        }}
        onCreateNewTester={handleCreateNewTester}
        onCloneTester={handleCloneTester}
        onDeleteTester={handleDeleteTester}
        onExportTesters={handleExportTesters}
        onImportTesters={handleImportTesters}
        onOpenTemplates={() => setShowTemplateModal(true)}
        totalRuns={results.length}
      />

      {/* MOBILE SEGMENTED CONTROL: Switch between Setup, Results, History on < lg screens */}
      <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-2 py-1.5 flex gap-1 shrink-0 z-30">
        <button
          type="button"
          onClick={() => setMobileView('setup')}
          className={`flex-1 py-2 px-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            mobileView === 'setup'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>1. Prompt Setup</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileView('results')}
          className={`flex-1 py-2 px-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all relative ${
            mobileView === 'results'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Play className="w-3.5 h-3.5" />
          <span>2. Results</span>
          {results.length > 0 && (
            <span className="text-[10px] bg-slate-950/60 px-1.5 py-0.2 rounded-full font-mono text-indigo-200">
              {results.length}
            </span>
          )}
          {isRunning && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping absolute top-1.5 right-2" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setMobileView('history')}
          className={`flex-1 py-2 px-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            mobileView === 'history'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>History</span>
        </button>
      </div>

      {/* Main Studio Body: Responsive Split View */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* LEFT COLUMN: Prompt Tester Configuration (Inputs, Files, Model, Assertions) */}
        <div
          className={`w-full lg:w-[50%] xl:w-[48%] flex flex-col border-r border-slate-800 bg-slate-950/70 overflow-hidden ${
            mobileView !== 'setup' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Sub-Tabs bar: Prompt Setup, Files, Model, Variables, Assertions */}
          <div className="px-3 sm:px-4 pt-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex gap-1 overflow-x-auto no-scrollbar pb-0.5">
              {[
                { id: 'prompt', label: 'Prompts', icon: FileText },
                {
                  id: 'files',
                  label: `Files (${activeFilesCount})`,
                  icon: Layers,
                },
                { id: 'model', label: 'Model', icon: Sliders },
                {
                  id: 'variables',
                  label: `Vars (${Object.keys(activeTester.variables || {}).length})`,
                  icon: Braces,
                },
                {
                  id: 'assertions',
                  label: `Rules (${activeTester.assertions?.length || 0})`,
                  icon: ShieldCheck,
                },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold border-b-2 transition-all shrink-0 whitespace-nowrap ${
                      isActive
                        ? 'border-indigo-500 text-indigo-300 bg-slate-800/50 rounded-t'
                        : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick Export Code Trigger */}
            <button
              onClick={() => setShowCodeModal(true)}
              className="text-xs text-slate-400 hover:text-indigo-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-800 transition-colors hidden sm:flex shrink-0 mb-1"
              title="View production API code snippet"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Get Code</span>
            </button>
          </div>

          {/* Configuration Tab Content Container (Full vertical scroll on mobile) */}
          <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-4">
            {activeTab === 'prompt' && (
              <PromptEditor tester={activeTester} onChange={handleUpdateTester} />
            )}

            {activeTab === 'files' && (
              <FilesManager
                files={activeTester.inputFiles}
                onChange={(updatedFiles) => handleUpdateTester({ inputFiles: updatedFiles })}
              />
            )}

            {activeTab === 'model' && (
              <ModelSettings tester={activeTester} onChange={handleUpdateTester} />
            )}

            {activeTab === 'variables' && (
              <VariablesManager tester={activeTester} onChange={handleUpdateTester} />
            )}

            {activeTab === 'assertions' && (
              <AssertionsManager tester={activeTester} onChange={handleUpdateTester} />
            )}
          </div>

          {/* Action Footer: Run Fresh Test Bar (Always visible at bottom of Setup panel) */}
          <div className="p-3 sm:p-3.5 bg-slate-900 border-t border-slate-800 space-y-2 shrink-0">
            {/* Context Guarantee Banner */}
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400 bg-slate-950/70 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-800/80">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="text-slate-300 font-medium truncate">Fresh Context:</span>
                <span className="text-slate-400 hidden sm:inline">Zero conversation memory carried over.</span>
                <span className="text-slate-400 sm:hidden truncate">Zero memory</span>
              </div>
              <span className="font-mono text-slate-400 text-[10px] shrink-0">
                ~{estimatedInputTokens} tok
              </span>
            </div>

            {/* Run Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRunFreshTest}
                disabled={isRunning || isMultiRunning}
                className="flex-1 min-h-[44px] py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:scale-[0.99] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed group"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Testing ({(currentStreamDuration / 1000).toFixed(1)}s)...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white text-white group-hover:scale-110 transition-transform" />
                    <span>Run Fresh Test</span>
                    <span className="text-[10px] text-indigo-200 bg-indigo-950/60 px-1.5 py-0.5 rounded font-mono hidden md:inline">
                      ⌘ + Enter
                    </span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleRunMultiBenchmark}
                disabled={isRunning || isMultiRunning}
                className="min-h-[44px] py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors disabled:opacity-50 shrink-0"
                title="Execute 3 fresh tests back-to-back to verify determinism and variance"
              >
                <Flame className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Run 3x Multi</span>
                <span className="sm:hidden text-xs">3x</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Fresh Results & History Studio */}
        <div
          className={`w-full lg:w-[50%] xl:w-[52%] flex flex-col bg-slate-950 overflow-hidden ${
            mobileView === 'setup' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Results Toolbar */}
          <div className="px-3 sm:px-4 py-2 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                {mobileView === 'history' ? 'Execution History' : 'Fresh Test Results'}
              </span>
              {results.length > 0 && (
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {results.length} runs
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {results.length >= 2 && (
                <button
                  onClick={() => setShowComparisonModal(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-medium border border-slate-700 transition-colors"
                >
                  <Columns2 className="w-3.5 h-3.5" />
                  <span>Compare</span>
                </button>
              )}
            </div>
          </div>

          {/* Results Content Area */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Primary Result Display Area (Visible in 'results' mobileView or desktop) */}
            <div
              className={`flex-1 p-3 sm:p-4 overflow-y-auto space-y-4 ${
                mobileView === 'history' ? 'hidden md:block' : 'block'
              }`}
            >
              {/* Live Streaming Card (when generating) */}
              {isRunning && (
                <div className="bg-slate-900 border border-indigo-500/60 rounded-xl p-4 shadow-xl space-y-3 animate-pulse">
                  <div className="flex items-center justify-between text-xs text-indigo-300">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" />
                      <span className="font-semibold">Executing Fresh Isolated Run...</span>
                    </div>
                    <span className="font-mono">{(currentStreamDuration / 1000).toFixed(1)}s</span>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-slate-200 min-h-[100px] whitespace-pre-wrap leading-relaxed">
                    {currentStreamOutput || 'Connecting to Gemini model...'}
                  </div>
                </div>
              )}

              {/* Active / Selected Result */}
              {activeResult ? (
                <ResultCard
                  result={activeResult}
                  isLatest={activeResult.id === results[0]?.id}
                  onUpdateResult={(updated) => {
                    setResults((prev) =>
                      prev.map((r) => (r.id === activeResult.id ? { ...r, ...updated } : r))
                    );
                  }}
                  onCompareWith={(resToCompare) => {
                    setCompareRuns({
                      runA: activeResult,
                      runB: resToCompare,
                    });
                    setShowComparisonModal(true);
                  }}
                />
              ) : !isRunning ? (
                <div className="h-full min-h-[240px] flex flex-col items-center justify-center p-6 sm:p-8 text-center border-2 border-dashed border-slate-800/80 rounded-xl bg-slate-900/20">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3">
                    <Play className="w-6 h-6 fill-indigo-400 ml-0.5" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-200">
                    Ready for a Fresh Test
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mt-1 leading-relaxed">
                    Configure your system prompt, human prompt, and input files, then click <strong>Run Fresh Test</strong>.
                  </p>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={handleRunFreshTest}
                      className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-sm"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Run Test Now</span>
                    </button>
                    <button
                      onClick={() => setShowTemplateModal(true)}
                      className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                    >
                      Browse Presets
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Error Alert */}
              {errorMessage && (
                <div className="p-3.5 rounded-lg bg-red-950/40 border border-red-800 text-red-200 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">Test Execution Error</div>
                    <div className="text-[11px] text-red-300 mt-0.5">{errorMessage}</div>
                  </div>
                </div>
              )}
            </div>

            {/* History Sidebar: full height in 'history' mobileView, right column on desktop */}
            <div
              className={`w-full md:w-64 lg:w-72 border-t md:border-t-0 md:border-l border-slate-800 bg-slate-950/90 shrink-0 ${
                mobileView === 'history' ? 'flex flex-1 h-full' : 'hidden md:flex md:h-full'
              }`}
            >
              <HistorySidebar
                results={results}
                selectedResultId={activeResult?.id || null}
                onSelectResult={(id) => {
                  setSelectedResultId(id);
                  if (window.innerWidth < 768) {
                    setMobileView('results');
                  }
                }}
                onClearHistory={() => {
                  setResults([]);
                  setSelectedResultId(null);
                }}
                onOpenCompare={() => setShowComparisonModal(true)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Code Export Modal */}
      {showCodeModal && (
        <CodeExportModal tester={activeTester} onClose={() => setShowCodeModal(false)} />
      )}

      {/* Template Library Modal */}
      {showTemplateModal && (
        <TemplateLibraryModal
          onSelectTemplate={(tpl) => {
            const existing = testers.find((t) => t.id === tpl.id);
            if (!existing) {
              setTesters([...testers, tpl]);
            }
            setActiveTesterId(tpl.id);
            setMobileView('setup');
          }}
          onClose={() => setShowTemplateModal(false)}
        />
      )}

      {/* Side-by-Side Comparison Modal */}
      {showComparisonModal && (
        <ResultsComparison
          results={results}
          initialRunA={compareRuns.runA || results[0]}
          initialRunB={compareRuns.runB || results[1] || results[0]}
          onClose={() => {
            setShowComparisonModal(false);
            setCompareRuns({});
          }}
        />
      )}
    </div>
  );
}
