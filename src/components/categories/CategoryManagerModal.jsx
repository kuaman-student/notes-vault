import React, { useState } from 'react';
import { useNotes } from '../../context/NotesContext';
import { FolderPlus, Trash2, Edit2, X, Plus, Layers, Check, Palette } from 'lucide-react';

const EMOJI_OPTIONS = ['⚡', '💻', '🧠', '🎯', '🚀', '📚', '🛡️', '🌐', '📦', '🔥', '💡', '🤖', '📊', '🎨'];
const COLOR_OPTIONS = [
  '#14b8a6', // Teal
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#f97316'  // Orange
];

export default function CategoryManagerModal({ isOpen, onClose }) {
  const { categories, addCategory, deleteCategory, notes } = useNotes();
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('⚡');
  const [newCatColor, setNewCatColor] = useState('#14b8a6');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      setErrorMsg('Category name is required.');
      return;
    }

    if (categories.some((c) => c.name.toLowerCase() === newCatName.trim().toLowerCase())) {
      setErrorMsg('Category with this name already exists.');
      return;
    }

    await addCategory({
      name: newCatName.trim(),
      icon: newCatIcon,
      color: newCatColor,
      description: newCatDesc.trim()
    });

    setNewCatName('');
    setNewCatDesc('');
    setErrorMsg('');
  };

  const handleDelete = async (catId, catName) => {
    if (confirm(`Delete category "${catName}"? Notes in this category will be reassigned to "General".`)) {
      await deleteCategory(catId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                Manage Custom Categories
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Create and organize your subjects with custom icons & colors
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Scrollable */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {/* Create New Category Form */}
          <form onSubmit={handleCreate} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 flex items-center space-x-1">
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Category</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  placeholder="Category Name (e.g. AI / ML, LeetCode DSA)"
                  value={newCatName}
                  onChange={(e) => {
                    setNewCatName(e.target.value);
                    setErrorMsg('');
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            {/* Emoji Selection */}
            <div>
              <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                Choose Icon:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setNewCatIcon(emoji)}
                    className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition ${
                      newCatIcon === emoji
                        ? 'bg-teal-500 text-white shadow-sm ring-2 ring-teal-500/40'
                        : 'bg-white dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selection */}
            <div>
              <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                Choose Accent Color:
              </span>
              <div className="flex flex-wrap gap-2 items-center">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewCatColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-6 h-6 rounded-full transition-transform flex items-center justify-center ${
                      newCatColor === c ? 'scale-125 ring-2 ring-offset-2 ring-white dark:ring-slate-900' : 'hover:scale-110'
                    }`}
                  >
                    {newCatColor === c && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>

            {errorMsg && <p className="text-xs text-rose-500">{errorMsg}</p>}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold text-xs shadow-md shadow-teal-500/20 transition flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Create Category</span>
              </button>
            </div>
          </form>

          {/* Existing Categories List */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Your Active Categories ({categories.length})
            </h4>

            <div className="space-y-2">
              {categories.map((cat) => {
                const noteCount = notes.filter((n) => n.category === cat.name).length;
                return (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        style={{ backgroundColor: `${cat.color}25`, borderColor: cat.color }}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-lg border"
                      >
                        {cat.icon || '📁'}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h5 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                            {cat.name}
                          </h5>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                            {noteCount} note{noteCount === 1 ? '' : 's'}
                          </span>
                        </div>
                        {cat.description && (
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {cat.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleDelete(cat.id, cat.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition"
                        title="Delete Category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
