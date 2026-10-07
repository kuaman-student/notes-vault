import React, { useState, useEffect } from 'react';
import { useNotes } from '../../context/NotesContext';
import MarkdownRenderer from '../notes/MarkdownRenderer';
import {
  X,
  Save,
  Bold,
  Italic,
  Heading,
  Code,
  Table,
  Quote,
  Eye,
  Edit2,
  Columns,
  Plus
} from 'lucide-react';

export default function NoteEditorModal({ isOpen, onClose }) {
  const {
    editingNote,
    saveNote,
    categories,
    folders,
    setIsCategoryModalOpen,
    setIsFolderModalOpen,
    setFolderModalParentId
  } = useNotes();

  const [title, setTitle] = useState('');
  const [folderId, setFolderId] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || 'General');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [tagsInput, setTagsInput] = useState('');
  const [content, setContent] = useState('');
  const [viewMode, setViewMode] = useState('split'); // 'split', 'edit', 'preview'

  useEffect(() => {
    if (editingNote) {
      setTitle(editingNote.title || '');
      setFolderId(editingNote.folderId || '');
      setCategory(editingNote.category || categories[0]?.name || 'General');
      setDifficulty(editingNote.difficulty || 'Intermediate');
      setTagsInput(editingNote.tags ? editingNote.tags.join(', ') : '');
      setContent(editingNote.content || '');
    } else {
      setTitle('');
      setFolderId('');
      setCategory(categories[0]?.name || 'General');
      setDifficulty('Intermediate');
      setTagsInput('');
      setContent('# New Note Title\n\nWrite your notes here in **Markdown**.\n\n## Core Concepts\n\n- Key Point 1\n- Key Point 2\n');
    }
  }, [editingNote, isOpen, categories]);

  if (!isOpen) return null;

  const insertSnippet = (prefix, suffix = '') => {
    const textarea = document.getElementById('note-editor-textarea');
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);
    const replacement = prefix + selected + suffix;
    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 10);
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert('Please enter a note title.');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const wordCount = content.split(/\s+/).length;
    const readTime = `${Math.max(1, Math.ceil(wordCount / 200))} min read`;

    const notePayload = {
      ...(editingNote || {}),
      title: title.trim(),
      folderId: folderId || null,
      category: category || 'General',
      difficulty,
      tags: tags.length > 0 ? tags : ['General'],
      readTime,
      summary: content.slice(0, 160).replace(/[#*`_>]/g, '').trim() + '...',
      content,
      revisionStatus: editingNote?.revisionStatus || 'need_revision',
      isBookmarked: editingNote?.isBookmarked || false
    };

    saveNote(notePayload);
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-md"
    >
      <div className="relative w-full max-w-6xl h-[92vh] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <span className="w-3 h-3 rounded-full bg-teal-500 animate-pulse" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
              {editingNote ? 'Edit Note' : 'Create New Note'}
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            <div className="hidden sm:flex items-center bg-slate-200 dark:bg-slate-800 rounded-xl p-1 text-xs">
              <button
                onClick={() => setViewMode('edit')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'edit' ? 'bg-white dark:bg-slate-700 text-teal-500 shadow-sm' : 'text-slate-500'
                }`}
                title="Editor only"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'split' ? 'bg-white dark:bg-slate-700 text-teal-500 shadow-sm' : 'text-slate-500'
                }`}
                title="Split view"
              >
                <Columns className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'preview' ? 'bg-white dark:bg-slate-700 text-teal-500 shadow-sm' : 'text-slate-500'
                }`}
                title="Preview only"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleSave}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-teal-500 hover:bg-teal-600 text-white shadow-md shadow-teal-500/20 transition"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save (Ctrl+S)</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Note Metadata Fields */}
        <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white dark:bg-slate-900">
          <div className="sm:col-span-2">
            <input
              type="text"
              placeholder="Note Title (e.g. Intro, What is Machine Learning?)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Folder / Branch Selector */}
          <div className="flex items-center space-x-1.5">
            <select
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-teal-500 truncate"
            >
              <option value="">📁 Root / No Folder</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.parentId ? '↳ 📂 ' : '📁 '} {f.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                setFolderModalParentId(null);
                setIsFolderModalOpen(true);
              }}
              className="p-2 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/30 transition shrink-0"
              title="Add New Folder"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Tags */}
          <div>
            <input
              type="text"
              placeholder="Tags: AI, ML, Math"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center space-x-1 overflow-x-auto bg-slate-50 dark:bg-slate-950/30 text-slate-600 dark:text-slate-400">
          <button
            onClick={() => insertSnippet('**', '**')}
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition text-xs flex items-center space-x-1"
            title="Bold"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertSnippet('*', '*')}
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition text-xs flex items-center space-x-1"
            title="Italic"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertSnippet('## ')}
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition text-xs flex items-center space-x-1"
            title="Heading 2"
          >
            <Heading className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertSnippet('```python\n', '\n```')}
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition text-xs flex items-center space-x-1"
            title="Code Block"
          >
            <Code className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertSnippet('> ')}
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition text-xs flex items-center space-x-1"
            title="Quote / Tip"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertSnippet('$$\n', '\n$$')}
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition text-xs font-mono font-bold"
            title="LaTeX Math Equation"
          >
            $f(x)$
          </button>
          <button
            onClick={() => insertSnippet('| Column 1 | Column 2 |\n| :--- | :--- |\n| Data 1 | Data 2 |\n')}
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition text-xs flex items-center space-x-1"
            title="Markdown Table"
          >
            <Table className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content Pane */}
        <div className="flex-1 flex overflow-hidden">
          {(viewMode === 'edit' || viewMode === 'split') && (
            <div className={`flex-1 flex flex-col p-4 border-r border-slate-200 dark:border-slate-800 ${viewMode === 'split' ? 'w-1/2' : 'w-full'}`}>
              <textarea
                id="note-editor-textarea"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write markdown content here..."
                className="w-full flex-1 p-4 rounded-xl bg-transparent font-mono text-sm leading-relaxed resize-none focus:outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400"
              />
            </div>
          )}

          {(viewMode === 'preview' || viewMode === 'split') && (
            <div className={`flex-1 p-6 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/20 ${viewMode === 'split' ? 'w-1/2' : 'w-full'}`}>
              <div className="max-w-2xl mx-auto">
                <MarkdownRenderer content={content} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
