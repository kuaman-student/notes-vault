import React, { useState, useEffect } from 'react';
import { useNotes } from '../../context/NotesContext';
import { FolderPlus, X, Folder, ChevronRight, Check } from 'lucide-react';

const FOLDER_ICONS = ['📁', '📂', '🤖', '💻', '🧠', '🎯', '🚀', '📚', '📦', '💡', '🌐', '🛡️', '⚡', '📊'];
const FOLDER_COLORS = ['#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export default function CreateFolderModal({ isOpen, onClose }) {
  const { folders, createFolder, folderModalParentId, setFolderModalParentId } = useNotes();
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState(folderModalParentId || '');
  const [icon, setIcon] = useState('📁');
  const [color, setColor] = useState('#14b8a6');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setParentId(folderModalParentId || '');
      setIcon(folderModalParentId ? '📂' : '📁');
      setErrorMsg('');
    }
  }, [isOpen, folderModalParentId]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Folder name is required.');
      return;
    }

    await createFolder({
      name: name.trim(),
      parentId: parentId || null,
      icon,
      color
    });

    setFolderModalParentId(null);
    onClose();
  };

  const selectedParent = folders.find((f) => f.id === parentId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <FolderPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
                {parentId ? `Add Subfolder inside "${selectedParent?.name}"` : 'Create New Folder'}
              </h3>
              <p className="text-xs text-slate-400">
                Organize your notes into branch-wise subjects & modules
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="py-4 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Folder Name:
            </label>
            <input
              type="text"
              placeholder="e.g. AI FOR EVERYONE, Week 1, System Design"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrorMsg('');
              }}
              autoFocus
              className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Parent Folder / Branch (Hierarchy):
            </label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-teal-500"
            >
              <option value="">📁 None (Create as Top-Level Root Folder)</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.parentId ? '↳ 📂 ' : '📁 '} {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Emoji / Icon Selector */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Folder Icon:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {FOLDER_ICONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition ${
                    icon === emoji
                      ? 'bg-teal-500 text-white shadow-sm ring-2 ring-teal-500/40'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selector */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Accent Color:
            </label>
            <div className="flex flex-wrap gap-2 items-center">
              {FOLDER_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-6 h-6 rounded-full transition-transform flex items-center justify-center ${
                    color === c ? 'scale-125 ring-2 ring-offset-2 ring-white dark:ring-slate-900' : 'hover:scale-110'
                  }`}
                >
                  {color === c && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {errorMsg && <p className="text-xs text-rose-500">{errorMsg}</p>}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-500 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold shadow-md shadow-teal-500/20 transition flex items-center space-x-1.5"
            >
              <FolderPlus className="w-4 h-4" />
              <span>{parentId ? 'Create Subfolder' : 'Create Folder'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
