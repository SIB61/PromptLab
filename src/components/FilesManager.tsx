import React, { useState, useRef } from 'react';
import {
  FileText,
  Upload,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  FileCode,
  FileSpreadsheet,
  Image as ImageIcon,
  Plus,
  HelpCircle,
  ExternalLink,
  X
} from 'lucide-react';
import { AttachedFile } from '../types/prompt';
import { formatBytes, estimateTokens } from '../utils/tokenEstimator';
import { SAMPLE_FILES } from '../utils/sampleData';

interface FilesManagerProps {
  files: AttachedFile[];
  onChange: (updatedFiles: AttachedFile[]) => void;
}

export const FilesManager: React.FC<FilesManagerProps> = ({ files, onChange }) => {
  const [dragOver, setDragOver] = useState(false);
  const [previewFile, setPreviewFile] = useState<AttachedFile | null>(null);
  const [showSamplePicker, setShowSamplePicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const newFiles: AttachedFile[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const isImage = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf';

      let content = '';
      let isBase64 = false;

      if (isImage || isPdf) {
        // Read as data URL for base64 inlineData
        content = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve((e.target?.result as string) || '');
          reader.readAsDataURL(file);
        });
        isBase64 = true;
      } else {
        // Read as plain text
        content = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve((e.target?.result as string) || '');
          reader.readAsText(file);
        });
        isBase64 = false;
      }

      newFiles.push({
        id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: file.name,
        size: file.size,
        type: file.type || 'text/plain',
        content,
        isBase64,
        enabled: true,
        preview: isImage ? content : content.slice(0, 300),
        lastModified: file.lastModified,
      });
    }

    onChange([...files, ...newFiles]);
  };

  const toggleFile = (id: string) => {
    onChange(
      files.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f))
    );
  };

  const removeFile = (id: string) => {
    onChange(files.filter((f) => f.id !== id));
  };

  const addSampleFile = (sample: AttachedFile) => {
    const exists = files.some((f) => f.name === sample.name);
    if (exists) {
      alert(`File "${sample.name}" is already attached.`);
      return;
    }
    onChange([
      ...files,
      {
        ...sample,
        id: `sample-${Date.now()}`,
      },
    ]);
    setShowSamplePicker(false);
  };

  const getFileIcon = (file: AttachedFile) => {
    if (file.isBase64 && file.type.startsWith('image/')) {
      return <ImageIcon className="w-4 h-4 text-emerald-400" />;
    }
    if (file.name.endsWith('.csv') || file.type.includes('csv') || file.type.includes('spreadsheet')) {
      return <FileSpreadsheet className="w-4 h-4 text-teal-400" />;
    }
    if (
      file.name.endsWith('.ts') ||
      file.name.endsWith('.js') ||
      file.name.endsWith('.py') ||
      file.name.endsWith('.json') ||
      file.name.endsWith('.html') ||
      file.name.endsWith('.css')
    ) {
      return <FileCode className="w-4 h-4 text-blue-400" />;
    }
    return <FileText className="w-4 h-4 text-indigo-400" />;
  };

  const activeFiles = files.filter((f) => f.enabled);
  const totalTokens = activeFiles.reduce((acc, f) => {
    if (f.isBase64) return acc + 258; // image token approx
    return acc + estimateTokens(f.content);
  }, 0);

  return (
    <div className="space-y-4">
      {/* File Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFileUpload(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-all ${
          dragOver
            ? 'border-indigo-500 bg-indigo-950/20'
            : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => handleFileUpload(e.target.files)}
          className="hidden"
        />
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs sm:text-sm font-medium text-slate-200">
              Tap or drag & drop files to attach
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Supports .txt, .md, .csv, .json, .ts, .py, code files & images
            </p>
          </div>
        </div>
      </div>

      {/* Header & Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Input Files ({files.length})
          </span>
          <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
            {activeFiles.length} enabled • ~{totalTokens} tokens
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSamplePicker(!showSamplePicker)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-medium transition-colors border border-slate-700"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Sample File
          </button>
        </div>
      </div>

      {/* Sample Files Picker Dropdown */}
      {showSamplePicker && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300 font-semibold border-b border-slate-800 pb-1.5">
            <span>Select a Sample Input File</span>
            <button
              onClick={() => setShowSamplePicker(false)}
              className="text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SAMPLE_FILES.map((sample) => (
              <button
                key={sample.id}
                onClick={() => addSampleFile(sample)}
                className="text-left p-2 rounded bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 transition-colors flex items-start gap-2"
              >
                <div className="mt-0.5">{getFileIcon(sample)}</div>
                <div className="truncate">
                  <div className="text-xs text-slate-200 font-medium truncate">{sample.name}</div>
                  <div className="text-[10px] text-slate-500">{formatBytes(sample.size)} • {sample.type}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Attached Files List */}
      {files.length === 0 ? (
        <div className="p-6 text-center rounded-lg bg-slate-900/30 border border-slate-800/60 text-slate-500 text-xs">
          No input files attached yet. You can attach source documents, logs, CSVs, or code files to provide context for your prompt tests.
        </div>
      ) : (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className={`p-3 rounded-lg border transition-all flex items-center justify-between gap-3 ${
                file.enabled
                  ? 'bg-slate-900/70 border-slate-800'
                  : 'bg-slate-950/40 border-slate-900 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => toggleFile(file.id)}
                  className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                    file.enabled
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                  }`}
                  title={file.enabled ? 'Enabled in prompt context' : 'Disabled (will not be sent in run)'}
                >
                  {file.enabled ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                </button>

                <div className="p-2 rounded bg-slate-800/70 border border-slate-700/50">
                  {getFileIcon(file)}
                </div>

                <div className="min-w-0">
                  <div className="text-xs font-medium text-slate-200 truncate flex items-center gap-2">
                    <span className="truncate">{file.name}</span>
                    {file.isBase64 && (
                      <span className="text-[9px] uppercase px-1 py-0.2 bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 rounded">
                        Multimodal
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>{formatBytes(file.size)}</span>
                    <span>•</span>
                    <span>{file.type || 'text/plain'}</span>
                    {!file.isBase64 && (
                      <>
                        <span>•</span>
                        <span>~{estimateTokens(file.content)} tokens</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setPreviewFile(file)}
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                  title="View file contents"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => removeFile(file.id)}
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-500 hover:text-red-400 transition-colors"
                  title="Remove file"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90dvh] flex flex-col overflow-hidden">
            <div className="px-3.5 py-2.5 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 truncate">
                {getFileIcon(previewFile)}
                <span className="text-xs font-semibold text-slate-200 truncate">
                  {previewFile.name}
                </span>
                <span className="text-[11px] text-slate-400">({formatBytes(previewFile.size)})</span>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[70vh]">
              {previewFile.isBase64 && previewFile.type.startsWith('image/') ? (
                <div className="flex justify-center bg-slate-950 p-4 rounded-lg">
                  <img
                    src={previewFile.content}
                    alt={previewFile.name}
                    className="max-h-96 object-contain rounded"
                  />
                </div>
              ) : (
                <pre className="text-xs text-slate-200 font-mono bg-slate-950 p-3 rounded-lg border border-slate-800 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {previewFile.content}
                </pre>
              )}
            </div>

            <div className="px-4 py-2.5 bg-slate-800/40 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setPreviewFile(null)}
                className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
