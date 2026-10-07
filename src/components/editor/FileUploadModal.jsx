import React, { useState, useRef } from 'react';
import { useNotes } from '../../context/NotesContext';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, X, Sparkles } from 'lucide-react';

export default function FileUploadModal({ isOpen, onClose }) {
  const { importMarkdownFiles, importJSONBackup, categories, folders } = useNotes();
  const [targetFolderId, setTargetFolderId] = useState('');
  const [targetCategory, setTargetCategory] = useState(categories[0]?.name || 'General');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files) => {
    const validFiles = files.filter((f) =>
      /\.(md|markdown|txt|json)$/i.test(f.name)
    );
    if (validFiles.length === 0) {
      setStatusMessage({ type: 'error', text: 'Please select valid .md or .json files.' });
      return;
    }
    setSelectedFiles(validFiles);
    setStatusMessage(null);
  };

  const handleUploadSubmit = async () => {
    if (selectedFiles.length === 0) return;
    setIsProcessing(true);
    try {
      // Check if JSON file
      const jsonFile = selectedFiles.find((f) => f.name.endsWith('.json'));
      if (jsonFile) {
        const count = await importJSONBackup(jsonFile);
        setStatusMessage({ type: 'success', text: `Successfully restored ${count} notes from JSON!` });
      } else {
        const mdFiles = selectedFiles.filter((f) => /\.(md|markdown|txt)$/i.test(f.name));
        const count = await importMarkdownFiles(mdFiles, targetFolderId || null, targetCategory);
        setStatusMessage({ type: 'success', text: `Successfully imported ${count} Markdown note${count > 1 ? 's' : ''}!` });
      }
      setTimeout(() => {
        setSelectedFiles([]);
        onClose();
      }, 1500);
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: 'Error importing file. Please check format.' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <UploadCloud className="w-5 h-5 text-teal-500" />
            <h3 className="font-bold text-slate-900 dark:text-white text-lg">
              Upload Notes (.md / .json)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`my-6 p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all ${
            dragActive
              ? 'border-teal-500 bg-teal-500/10 scale-[1.01]'
              : 'border-slate-300 dark:border-slate-700 hover:border-teal-500/60 bg-slate-50 dark:bg-slate-800/40'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".md,.markdown,.txt,.json"
            onChange={handleChange}
            className="hidden"
          />

          <div className="w-14 h-14 rounded-2xl bg-teal-500/15 flex items-center justify-center text-teal-500 mb-3">
            <UploadCloud className="w-7 h-7" />
          </div>

          <h4 className="font-semibold text-slate-900 dark:text-white text-base">
            Drag & drop your files here
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-center">
            Supports <strong className="text-teal-500">.md</strong> (Markdown) and <strong className="text-indigo-400">.json</strong> backups.
          </p>

          <span className="mt-4 px-3.5 py-1.5 rounded-xl bg-teal-500 text-white font-medium text-xs hover:bg-teal-600 shadow-md shadow-teal-500/20 transition">
            Browse from Computer
          </span>
        </div>

        {/* Selected files preview */}
        {selectedFiles.length > 0 && (
          <div className="mb-4 max-h-36 overflow-y-auto space-y-1.5 p-2 bg-slate-100 dark:bg-slate-800/60 rounded-xl">
            {selectedFiles.map((f, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                <div className="flex items-center space-x-2 truncate">
                  <FileText className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                  <span className="truncate font-medium">{f.name}</span>
                </div>
                <span className="text-[11px] text-slate-400 shrink-0">
                  {(f.size / 1024).toFixed(1)} KB
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Status Message */}
        {statusMessage && (
          <div
            className={`flex items-center space-x-2 text-xs p-3 rounded-xl mb-4 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Target Folder / Branch Selection */}
        <div className="mb-3">
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
            Target Folder / Branch:
          </label>
          <select
            value={targetFolderId}
            onChange={(e) => setTargetFolderId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-teal-500"
          >
            <option value="">📁 Root (No Folder)</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.parentId ? '↳ 📂 ' : '📁 '} {f.name}
              </option>
            ))}
          </select>
        </div>

        {/* Assign Category for imported files */}
        <div className="mb-4">
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
            Assign to Category:
          </label>
          <select
            value={targetCategory}
            onChange={(e) => setTargetCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-teal-500"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.icon || '📁'} {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition"
          >
            Cancel
          </button>
          <button
            onClick={handleUploadSubmit}
            disabled={selectedFiles.length === 0 || isProcessing}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-teal-500 hover:bg-teal-600 text-white shadow-lg shadow-teal-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isProcessing ? 'Importing...' : `Import ${selectedFiles.length} File${selectedFiles.length > 1 ? 's' : ''}`}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
