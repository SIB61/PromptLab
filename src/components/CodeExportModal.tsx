import React, { useState } from 'react';
import { X, Copy, Check, Code2, Terminal, FileJson } from 'lucide-react';
import { PromptTester } from '../types/prompt';
import { substituteVariables } from '../utils/tokenEstimator';

interface CodeExportModalProps {
  tester: PromptTester;
  onClose: () => void;
}

export const CodeExportModal: React.FC<CodeExportModalProps> = ({ tester, onClose }) => {
  const [activeTab, setActiveTab] = useState<'nodejs' | 'python' | 'curl' | 'json'>('nodejs');
  const [copied, setCopied] = useState(false);

  const sysPrompt = substituteVariables(tester.systemPrompt, tester.variables);
  const userPrompt = substituteVariables(tester.humanPrompt, tester.variables);
  const activeFiles = tester.inputFiles.filter((f) => f.enabled);

  const getCode = () => {
    switch (activeTab) {
      case 'nodejs':
        return `// Tested & Verified in PromptLab
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function runPrompt() {
  const contents = [
${activeFiles
  .map(
    (f) =>
      `    { text: \`--- ATTACHED FILE: ${f.name} ---\\n\${/* load ${f.name} */ ""}\\n--- END FILE ---\` },`
  )
  .join('\n')}
    { text: ${JSON.stringify(userPrompt)} }
  ];

  const response = await ai.models.generateContent({
    model: "${tester.model || 'gemini-3.8-flash'}",
    contents: { parts: contents },
    config: {
${sysPrompt ? `      systemInstruction: ${JSON.stringify(sysPrompt)},\n` : ''}      temperature: ${tester.temperature},
      topP: ${tester.topP},
${tester.responseFormat === 'json' ? '      responseMimeType: "application/json",\n' : ''}    }
  });

  console.log("Model Output:", response.text);
  return response.text;
}

runPrompt();`;

      case 'python':
        return `# Tested & Verified in PromptLab
import os
from google import genai
from google.genai import types

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

response = client.models.generate_content(
    model="${tester.model || 'gemini-3.8-flash'}",
    contents=[
${activeFiles
  .map(
    (f) =>
      `        f"--- ATTACHED FILE: ${f.name} ---\\n{file_content}\\n--- END FILE ---",`
  )
  .join('\n')}
        ${JSON.stringify(userPrompt)}
    ],
    config=types.GenerateContentConfig(
${sysPrompt ? `        system_instruction=${JSON.stringify(sysPrompt)},\n` : ''}        temperature=${tester.temperature},
        top_p=${tester.topP},
${tester.responseFormat === 'json' ? '        response_mime_type="application/json",\n' : ''}    )
)

print(response.text)`;

      case 'curl':
        return `curl https://generativelanguage.googleapis.com/v1beta/models/${tester.model}:generateContent?key=$GEMINI_API_KEY \\
  -H 'Content-Type: application/json' \\
  -d '{
    "systemInstruction": {
      "parts": [{ "text": ${JSON.stringify(sysPrompt)} }]
    },
    "contents": [
      {
        "parts": [
          { "text": ${JSON.stringify(userPrompt)} }
        ]
      }
    ],
    "generationConfig": {
      "temperature": ${tester.temperature},
      "topP": ${tester.topP}
    }
  }'`;

      case 'json':
        return JSON.stringify(
          {
            name: tester.name,
            model: tester.model,
            systemPrompt: sysPrompt,
            humanPrompt: userPrompt,
            attachedFiles: activeFiles.map((f) => ({ name: f.name, size: f.size, type: f.type })),
            temperature: tester.temperature,
            topP: tester.topP,
            responseFormat: tester.responseFormat,
            assertions: tester.assertions,
          },
          null,
          2
        );
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden max-h-[92dvh]">
        {/* Header */}
        <div className="px-4 py-3 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-200 truncate">
              Export Prompt to System / API Code
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab selection (mobile scrollable) */}
        <div className="px-3 sm:px-4 pt-2.5 flex gap-1.5 overflow-x-auto no-scrollbar border-b border-slate-800 bg-slate-900/50 shrink-0">
          {[
            { id: 'nodejs', label: 'Node.js', icon: Code2 },
            { id: 'python', label: 'Python', icon: Terminal },
            { id: 'curl', label: 'cURL', icon: Terminal },
            { id: 'json', label: 'JSON Config', icon: FileJson },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap shrink-0 ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-400 bg-slate-800/50 rounded-t'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Code Content */}
        <div className="p-4 flex-1 overflow-y-auto">
          <pre className="text-xs font-mono bg-slate-950 p-3.5 rounded-lg border border-slate-800 text-slate-200 overflow-x-auto leading-relaxed select-text">
            {getCode()}
          </pre>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-800/40 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Plug directly into your production backend service
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
