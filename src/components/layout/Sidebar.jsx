import React from 'react';
import { useNotes } from '../../context/NotesContext';
import { useSecurity } from '../../context/SecurityContext';
import SidebarTree from './SidebarTree';
import {
  Folder,
  FolderPlus,
  Tag,
  Star,
  Layers,
  Plus,
  X,
  FileText,
  Upload,
  ChevronsDown,
  ChevronsUp,
  GitBranch,
  Filter
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const {
    notes,
    filteredNotes,
    categories,
    selectedNoteId,
    setSelectedNoteId,
    selectedCategory,
    setSelectedCategory,
    selectedTag,
    setSelectedTag,
    statusFilter,
    setStatusFilter,
    allTags,
    setIsUploadOpen,
    setIsFolderModalOpen,
    setFolderModalParentId,
    setIsEditorOpen,
    setEditingNote,
    expandAllFolders,
    collapseAllFolders,
    sidebarViewMode,
    setSidebarViewMode,
    toggleBookmark
  } = useNotes();

  const { requireAuth } = useSecurity();

  const totalNotes = notes.length;
  const masteredCount = notes.filter((n) => n.revisionStatus === 'mastered').length;
  const revisionCount = notes.filter((n) => n.revisionStatus === 'need_revision').length;
  const bookmarkedCount = notes.filter((n) => n.isBookmarked).length;

  const handleSelectNote = (id) => {
    setSelectedNoteId(id);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const handleNewRootFolder = () => {
    requireAuth(() => {
      setFolderModalParentId(null);
      setIsFolderModalOpen(true);
    });
  };

  const handleNewNote = () => {
    requireAuth(() => {
      setEditingNote({
        title: '',
        content: '# New Note\n\nWrite your thoughts here in Markdown...\n'
      });
      setIsEditorOpen(true);
    });
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-fade-in"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-16 bottom-0 left-0 z-40 w-80 bg-[#12141c] dark:bg-[#0c0e15] border-r border-slate-800/80 flex flex-col transition-all duration-300 ease-in-out shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header Row with View Mode Switcher and Quick Actions */}
        <div className="p-3 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center justify-between mb-2">
            {/* View Mode Toggle: Tree (Branches) vs Filters */}
            <div className="flex items-center space-x-1 bg-slate-900/90 rounded-xl p-1 text-xs">
              <button
                onClick={() => setSidebarViewMode('tree')}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg transition ${
                  sidebarViewMode === 'tree'
                    ? 'bg-teal-500 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Branch Folder Hierarchy"
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span>Tree View</span>
              </button>

              <button
                onClick={() => setSidebarViewMode('list')}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg transition ${
                  sidebarViewMode === 'list'
                    ? 'bg-teal-500 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Filter by Status / Tags"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filters</span>
              </button>
            </div>

            {/* Tree Management Actions */}
            <div className="flex items-center space-x-1">
              {sidebarViewMode === 'tree' && (
                <>
                  <button
                    onClick={expandAllFolders}
                    className="p-1 rounded text-slate-400 hover:text-white transition"
                    title="Expand All Folders"
                  >
                    <ChevronsDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={collapseAllFolders}
                    className="p-1 rounded text-slate-400 hover:text-white transition"
                    title="Collapse All Folders"
                  >
                    <ChevronsUp className="w-3.5 h-3.5" />
                  </button>
                </>
              )}

              {/* Add Root Folder */}
              <button
                onClick={handleNewRootFolder}
                className="p-1.5 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 text-teal-400 transition"
                title="New Root Folder"
              >
                <FolderPlus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Status Bar for revision stats */}
          <div className="grid grid-cols-4 gap-1 text-[10px] font-mono text-center pt-1 border-t border-slate-800/60">
            <button
              onClick={() => {
                setStatusFilter('all');
                setSidebarViewMode('list');
              }}
              className={`py-1 rounded-lg transition ${
                statusFilter === 'all' && sidebarViewMode === 'list'
                  ? 'bg-teal-500 text-white'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              All ({totalNotes})
            </button>
            <button
              onClick={() => {
                setStatusFilter('need_revision');
                setSidebarViewMode('list');
              }}
              className={`py-1 rounded-lg transition ${
                statusFilter === 'need_revision' && sidebarViewMode === 'list'
                  ? 'bg-amber-500 text-white'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
              title="Need Revision"
            >
              ⚠️ {revisionCount}
            </button>
            <button
              onClick={() => {
                setStatusFilter('mastered');
                setSidebarViewMode('list');
              }}
              className={`py-1 rounded-lg transition ${
                statusFilter === 'mastered' && sidebarViewMode === 'list'
                  ? 'bg-emerald-500 text-white'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
              title="Mastered"
            >
              ✅ {masteredCount}
            </button>
            <button
              onClick={() => {
                setStatusFilter('bookmarked');
                setSidebarViewMode('list');
              }}
              className={`py-1 rounded-lg transition ${
                statusFilter === 'bookmarked' && sidebarViewMode === 'list'
                  ? 'bg-indigo-500 text-white'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
              title="Bookmarked"
            >
              ⭐ {bookmarkedCount}
            </button>
          </div>
        </div>

        {/* Main Content Pane: TREE VIEW or LIST FILTER VIEW */}
        <div className="flex-1 overflow-y-auto p-2">
          {sidebarViewMode === 'tree' ? (
            /* --- TREE VIEW (BRANCH WISE FOLDERS & SUBFOLDERS) --- */
            <SidebarTree />
          ) : (
            /* --- LIST FILTER VIEW --- */
            <div className="space-y-1">
              {filteredNotes.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-30 text-teal-500" />
                  No notes match this filter.
                </div>
              ) : (
                filteredNotes.map((note) => {
                  const isSelected = selectedNoteId === note.id;
                  const isMastered = note.revisionStatus === 'mastered';
                  const isNeedRevision = note.revisionStatus === 'need_revision';

                  return (
                    <div
                      key={note.id}
                      onClick={() => handleSelectNote(note.id)}
                      className={`group relative p-3 rounded-2xl cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-teal-500/15 border-l-4 border-teal-500 shadow-sm text-white'
                          : 'hover:bg-slate-800/50 border-l-4 border-transparent text-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="text-xs sm:text-sm font-semibold line-clamp-2">
                          {note.title}
                        </h4>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBookmark(note.id);
                          }}
                          className={`p-1 rounded-lg transition shrink-0 ${
                            note.isBookmarked
                              ? 'text-amber-400'
                              : 'text-slate-600 hover:text-slate-300 opacity-0 group-hover:opacity-100'
                          }`}
                        >
                          <Star
                            className="w-3.5 h-3.5"
                            fill={note.isBookmarked ? 'currentColor' : 'none'}
                          />
                        </button>
                      </div>

                      <div className="flex items-center space-x-2 mt-2 text-[10px] text-slate-400">
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            isMastered
                              ? 'bg-emerald-400'
                              : isNeedRevision
                              ? 'bg-amber-400'
                              : 'bg-sky-400'
                          }`}
                        />
                        <span className="truncate">{note.category}</span>
                        <span>•</span>
                        <span className="font-mono">{note.readTime || '5m'}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Tags Section Drawer */}
        {allTags.length > 0 && (
          <div className="px-3 py-2 border-t border-slate-800/80 bg-slate-950/30">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center space-x-1">
              <Tag className="w-3 h-3 text-teal-500" />
              <span>Tags</span>
            </div>
            <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setSelectedTag(selectedTag === tag ? null : tag);
                    setSidebarViewMode('list');
                  }}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-md transition ${
                    selectedTag === tag
                      ? 'bg-teal-500 text-white font-semibold'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Upload Dropzone Action Banner */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/50">
          <button
            onClick={() => requireAuth(() => setIsUploadOpen(true))}
            className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 text-xs font-semibold border border-teal-500/20 transition shadow-sm"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Drop / Upload .md or .json</span>
          </button>
        </div>
      </aside>
    </>
  );
}
