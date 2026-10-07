import React, { useState, useMemo, useRef } from 'react';
import { useNotes } from '../../context/NotesContext';
import { X, Network, ZoomIn, ZoomOut, RotateCcw, Sparkles } from 'lucide-react';

export default function KnowledgeGraphModal({ isOpen, onClose }) {
  const { notes, folders, setSelectedNoteId } = useNotes();
  const [zoom, setZoom] = useState(1);
  const [hoveredNode, setHoveredNode] = useState(null);
  const containerRef = useRef(null);

  // Compute graph coordinates
  const graphData = useMemo(() => {
    if (!notes || notes.length === 0) return { nodes: [], links: [] };

    const width = 850;
    const height = 550;
    const centerX = width / 2;
    const centerY = height / 2;

    const nodes = [];
    const links = [];

    // Central core node
    nodes.push({
      id: 'core-brain',
      label: 'Nexus Hub',
      type: 'core',
      x: centerX,
      y: centerY,
      radius: 22,
      color: '#14b8a6'
    });

    const rootFolders = folders.filter((f) => !f.parentId);
    const folderCoords = {};

    // 1. Root Folders positioned in an inner ring
    const rootRadius = 130;
    rootFolders.forEach((rf, idx) => {
      const angle = (idx / Math.max(1, rootFolders.length)) * 2 * Math.PI - Math.PI / 2;
      const x = centerX + rootRadius * Math.cos(angle);
      const y = centerY + rootRadius * Math.sin(angle);
      folderCoords[rf.id] = { x, y, color: rf.color || '#3b82f6', angle };

      nodes.push({
        id: `folder-${rf.id}`,
        label: `${rf.icon || '📁'} ${rf.name}`,
        type: 'folder',
        x,
        y,
        radius: 17,
        color: rf.color || '#3b82f6'
      });

      links.push({
        sourceX: centerX,
        sourceY: centerY,
        targetX: x,
        targetY: y,
        color: rf.color || '#3b82f6',
        dash: '4,4'
      });
    });

    // 2. Subfolders positioned around their parent root folder
    const subfolderRadius = 75;
    const subFolders = folders.filter((f) => f.parentId);
    const subCounts = {};

    subFolders.forEach((sf) => {
      const parentCoord = folderCoords[sf.parentId] || { x: centerX, y: centerY, color: '#06b6d4', angle: 0 };
      if (!subCounts[sf.parentId]) subCounts[sf.parentId] = 0;
      const subIdx = subCounts[sf.parentId]++;

      const angle = parentCoord.angle + (subIdx + 1) * 0.8;
      const x = parentCoord.x + subfolderRadius * Math.cos(angle);
      const y = parentCoord.y + subfolderRadius * Math.sin(angle);
      folderCoords[sf.id] = { x, y, color: sf.color || '#06b6d4', angle };

      nodes.push({
        id: `folder-${sf.id}`,
        label: `${sf.icon || '📂'} ${sf.name}`,
        type: 'folder',
        x,
        y,
        radius: 14,
        color: sf.color || '#06b6d4'
      });

      links.push({
        sourceX: parentCoord.x,
        sourceY: parentCoord.y,
        targetX: x,
        targetY: y,
        color: sf.color || '#06b6d4',
        dash: '3,3'
      });
    });

    // 3. Notes positioned around their containing folder or subfolder
    const noteOrbitRadius = 60;
    const noteCounts = {};

    notes.forEach((note) => {
      const targetFolderCoord = (note.folderId && folderCoords[note.folderId])
        ? folderCoords[note.folderId]
        : { x: centerX, y: centerY + 140, color: '#14b8a6', angle: 0 };

      const key = note.folderId || 'root';
      if (!noteCounts[key]) noteCounts[key] = 0;
      const noteIdx = noteCounts[key]++;

      const angle = targetFolderCoord.angle + noteIdx * 1.0;
      const x = targetFolderCoord.x + (noteOrbitRadius + (noteIdx % 2) * 15) * Math.cos(angle);
      const y = targetFolderCoord.y + (noteOrbitRadius + (noteIdx % 2) * 15) * Math.sin(angle);

      nodes.push({
        id: note.id,
        label: note.title,
        noteObj: note,
        type: 'note',
        x,
        y,
        radius: 9,
        color: targetFolderCoord.color
      });

      links.push({
        sourceX: targetFolderCoord.x,
        sourceY: targetFolderCoord.y,
        targetX: x,
        targetY: y,
        color: targetFolderCoord.color,
        dash: 'none'
      });
    });

    return { nodes, links };
  }, [notes, folders]);

  if (!isOpen) return null;

  const handleNodeClick = (node) => {
    if (node.type === 'note' && node.noteObj) {
      setSelectedNoteId(node.noteObj.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-5xl h-[85vh] bg-[#060a12] border border-teal-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden neon-glow-teal">
        {/* Header HUD */}
        <div className="px-6 py-4 border-b border-teal-500/20 flex items-center justify-between bg-black/50 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-400 flex items-center justify-center animate-pulse">
              <Network className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-mono font-bold text-teal-300 text-sm tracking-wider uppercase">
                  Cosmic Knowledge Graph
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/30">
                  {notes.length} Notes • {folders.length} Branches
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Click any note node to open directly
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Zoom Controls */}
            <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 rounded-xl p-1 text-slate-400">
              <button
                onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))}
                className="p-1 hover:text-white transition"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono px-1">{(zoom * 100).toFixed(0)}%</span>
              <button
                onClick={() => setZoom((z) => Math.min(2.0, z + 0.15))}
                className="p-1 hover:text-white transition"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoom(1)}
                className="p-1 hover:text-white transition"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Graph Canvas Visualizer */}
        <div
          ref={containerRef}
          className="flex-1 relative overflow-hidden flex items-center justify-center bg-[radial-gradient(#14b8a615_1px,transparent_1px)] [background-size:24px_24px]"
        >
          <svg
            viewBox="0 0 850 550"
            className="w-full h-full cursor-grab active:cursor-grabbing transition-transform duration-200"
            style={{ transform: `scale(${zoom})` }}
          >
            <defs>
              <radialGradient id="hubGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#0d9488" stopOpacity="0.1" />
              </radialGradient>
            </defs>

            {/* Links / Connections */}
            {graphData.links.map((link, idx) => (
              <line
                key={idx}
                x1={link.sourceX}
                y1={link.sourceY}
                x2={link.targetX}
                y2={link.targetY}
                stroke={link.color}
                strokeOpacity={0.35}
                strokeWidth={1.5}
                strokeDasharray={link.dash}
              />
            ))}

            {/* Nodes */}
            {graphData.nodes.map((node) => {
              const isHovered = hoveredNode?.id === node.id;
              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onMouseEnter={() => setHoveredNode(node)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={() => handleNodeClick(node)}
                  className="cursor-pointer"
                >
                  {/* Outer Pulsing Aura */}
                  <circle
                    r={node.radius + (isHovered ? 8 : 4)}
                    fill={node.color}
                    opacity={isHovered ? 0.4 : 0.15}
                    className="transition-all duration-300"
                  />

                  {/* Main Circle */}
                  <circle
                    r={node.radius}
                    fill={node.type === 'core' ? 'url(#hubGlow)' : node.color}
                    stroke="#ffffff"
                    strokeWidth={isHovered ? 2 : 1}
                    strokeOpacity={0.8}
                    className="transition-all duration-200"
                  />

                  {/* Label */}
                  <text
                    y={node.radius + 14}
                    textAnchor="middle"
                    fill={isHovered ? '#ffffff' : '#94a3b8'}
                    fontSize={node.type === 'note' ? '9' : '11'}
                    fontFamily="monospace"
                    fontWeight={isHovered ? 'bold' : 'normal'}
                    className="pointer-events-none select-none transition-colors"
                  >
                    {node.label.length > 20 ? node.label.slice(0, 18) + '...' : node.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Floating HUD Card for hovered node */}
          {hoveredNode && hoveredNode.type === 'note' && (
            <div className="absolute bottom-6 left-6 p-4 rounded-2xl bg-slate-900/90 border border-teal-500/40 backdrop-blur-md text-xs font-mono max-w-sm animate-fade-in shadow-2xl">
              <div className="flex items-center space-x-2 text-teal-400 font-bold mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="truncate">{hoveredNode.noteObj?.title}</span>
              </div>
              <p className="text-slate-300 text-[11px] line-clamp-2">
                {hoveredNode.noteObj?.summary || 'No summary'}
              </p>
              <div className="flex items-center space-x-2 mt-2 text-[10px] text-slate-400">
                <span className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-300">
                  {hoveredNode.noteObj?.category}
                </span>
                <span>{hoveredNode.noteObj?.readTime}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
