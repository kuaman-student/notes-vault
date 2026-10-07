import React from 'react';
import { useNotes } from '../../context/NotesContext';
import { useSecurity } from '../../context/SecurityContext';
import {
  FileText,
  ChevronRight,
  ChevronDown,
  Plus,
  FolderPlus,
  Trash2,
  Star
} from 'lucide-react';

function TreeNode({
  folder,
  folders,
  notes,
  depth = 0,
  onSelectNote,
  selectedNoteId,
  onToggleFolder,
  onCreateNoteInFolder,
  onCreateSubfolder,
  onDeleteFolder,
  onToggleBookmark
}) {
  const childFolders = folders.filter((f) => f.parentId === folder.id);
  const folderNotes = notes.filter((n) => n.folderId === folder.id);
  const isExpanded = folder.isExpanded !== false;

  return (
    <div className="select-none">
      {/* Folder Header Row */}
      <div
        className={`group flex items-center justify-between py-1.5 px-2 rounded-xl cursor-pointer text-xs transition-colors ${
          isExpanded
            ? 'bg-slate-200/50 dark:bg-slate-800/40 text-slate-900 dark:text-slate-100 font-semibold'
            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/40 dark:hover:bg-slate-800/30'
        }`}
        style={{ paddingLeft: `${Math.max(8, depth * 14 + 8)}px` }}
        onClick={() => onToggleFolder(folder.id)}
      >
        <div className="flex items-center space-x-1.5 min-w-0">
          {/* Chevron Collapse Indicator */}
          <span className="text-slate-400 hover:text-white shrink-0 p-0.5">
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </span>

          {/* Folder Icon / Document Icon matching screenshot */}
          <span className="text-sm shrink-0">{folder.icon || '📁'}</span>

          {/* Folder Name */}
          <span className="truncate tracking-tight font-medium text-slate-800 dark:text-slate-200 uppercase text-[11px]">
            {folder.name}
          </span>
        </div>

        {/* Hover Quick Action Buttons */}
        <div
          className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Add Note in this folder */}
          <button
            onClick={() => onCreateNoteInFolder(folder.id, folder.name)}
            className="p-1 rounded hover:bg-teal-500/20 text-slate-400 hover:text-teal-400 transition"
            title={`New Note in "${folder.name}"`}
          >
            <Plus className="w-3 h-3" />
          </button>

          {/* Add Subfolder inside this folder */}
          <button
            onClick={() => onCreateSubfolder(folder.id)}
            className="p-1 rounded hover:bg-teal-500/20 text-slate-400 hover:text-teal-400 transition"
            title={`New Subfolder inside "${folder.name}"`}
          >
            <FolderPlus className="w-3 h-3" />
          </button>

          {/* Delete Folder */}
          <button
            onClick={() => onDeleteFolder(folder.id, folder.name)}
            className="p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
            title="Delete Folder"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Children: Subfolders & Notes */}
      {isExpanded && (
        <div className="relative">
          {/* Vertical Branch Guide Line */}
          <div
            className="absolute left-0 top-0 bottom-0 border-l border-slate-300 dark:border-slate-800/80"
            style={{ left: `${depth * 14 + 14}px` }}
          />

          {/* Render Nested Subfolders */}
          {childFolders.map((subFolder) => (
            <TreeNode
              key={subFolder.id}
              folder={subFolder}
              folders={folders}
              notes={notes}
              depth={depth + 1}
              onSelectNote={onSelectNote}
              selectedNoteId={selectedNoteId}
              onToggleFolder={onToggleFolder}
              onCreateNoteInFolder={onCreateNoteInFolder}
              onCreateSubfolder={onCreateSubfolder}
              onDeleteFolder={onDeleteFolder}
              onToggleBookmark={onToggleBookmark}
            />
          ))}

          {/* Render Notes directly inside this folder */}
          {folderNotes.map((note) => {
            const isSelected = selectedNoteId === note.id;
            return (
              <div
                key={note.id}
                onClick={() => onSelectNote(note.id)}
                className={`group flex items-center justify-between py-1.5 px-2 rounded-xl cursor-pointer text-xs transition-all ${
                  isSelected
                    ? 'bg-slate-800 text-white font-medium shadow-sm ring-1 ring-white/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
                style={{ paddingLeft: `${(depth + 1) * 14 + 12}px` }}
              >
                <div className="flex items-center space-x-2 min-w-0">
                  <FileText
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isSelected ? 'text-teal-400' : 'text-slate-400'
                    }`}
                  />
                  <span className="truncate text-xs">{note.title}</span>
                </div>

                <div className="flex items-center space-x-1 shrink-0 ml-1">
                  {/* Bookmark Star */}
                  {note.isBookmarked && (
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                  )}
                  {/* Status dot */}
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      note.revisionStatus === 'mastered'
                        ? 'bg-emerald-400'
                        : note.revisionStatus === 'need_revision'
                        ? 'bg-amber-400'
                        : 'bg-sky-400'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function SidebarTree() {
  const {
    folders,
    notes,
    selectedNoteId,
    setSelectedNoteId,
    toggleFolderExpansion,
    setIsEditorOpen,
    setEditingNote,
    setIsFolderModalOpen,
    setFolderModalParentId,
    deleteFolder,
    toggleBookmark
  } = useNotes();

  const { requireAuth } = useSecurity();

  // Root folders (parentId is null or empty)
  const rootFolders = folders.filter((f) => !f.parentId);

  // Notes without any folder (Root notes)
  const unassignedNotes = notes.filter((n) => !n.folderId);

  const handleCreateNoteInFolder = (folderId, folderName) => {
    requireAuth(() => {
      setEditingNote({
        folderId,
        category: folderName,
        title: '',
        content: `# New Note in ${folderName}\n\nWrite your notes here in Markdown.\n`
      });
      setIsEditorOpen(true);
    });
  };

  const handleCreateSubfolder = (parentFolderId) => {
    requireAuth(() => {
      setFolderModalParentId(parentFolderId);
      setIsFolderModalOpen(true);
    });
  };

  const handleDeleteFolder = (folderId, folderName) => {
    requireAuth(() => {
      if (confirm(`Delete folder "${folderName}" and all its subfolders? Notes will be moved to root.`)) {
        deleteFolder(folderId);
      }
    });
  };

  return (
    <div className="space-y-0.5 p-1">
      {/* Root Folders Tree */}
      {rootFolders.map((rootFolder) => (
        <TreeNode
          key={rootFolder.id}
          folder={rootFolder}
          folders={folders}
          notes={notes}
          depth={0}
          onSelectNote={setSelectedNoteId}
          selectedNoteId={selectedNoteId}
          onToggleFolder={toggleFolderExpansion}
          onCreateNoteInFolder={handleCreateNoteInFolder}
          onCreateSubfolder={handleCreateSubfolder}
          onDeleteFolder={handleDeleteFolder}
          onToggleBookmark={toggleBookmark}
        />
      ))}

      {/* Unassigned / Root Notes */}
      {unassignedNotes.length > 0 && (
        <div className="pt-2 mt-2 border-t border-slate-200/80 dark:border-slate-800/80">
          <div className="px-2 py-1 text-[10px] uppercase tracking-wider font-semibold text-slate-400">
            Root Notes ({unassignedNotes.length})
          </div>
          {unassignedNotes.map((note) => {
            const isSelected = selectedNoteId === note.id;
            return (
              <div
                key={note.id}
                onClick={() => setSelectedNoteId(note.id)}
                className={`flex items-center justify-between py-1.5 px-3 rounded-xl cursor-pointer text-xs transition-colors ${
                  isSelected
                    ? 'bg-slate-800 text-white font-medium shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center space-x-2 min-w-0">
                  <FileText
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isSelected ? 'text-teal-400' : 'text-slate-400'
                    }`}
                  />
                  <span className="truncate">{note.title}</span>
                </div>
                {note.isBookmarked && (
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
