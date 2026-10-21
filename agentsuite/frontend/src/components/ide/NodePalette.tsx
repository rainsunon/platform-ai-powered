import React from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  StopCircle,
  Bot,
  User,
  GitBranch,
  Workflow,
  Sparkles,
  GripVertical,
  X,
} from 'lucide-react';

interface NodePaletteProps {
  onClose?: () => void;
}

const nodeTypes = [
  { type: 'start', label: 'Start', icon: Play, color: 'text-green-400', bg: 'bg-green-500/10', description: 'Entry point' },
  { type: 'end', label: 'End', icon: StopCircle, color: 'text-red-400', bg: 'bg-red-500/10', description: 'Completion point' },
  { type: 'task', label: 'Bot Task', icon: Bot, color: 'text-blue-400', bg: 'bg-blue-500/10', description: 'Automated action' },
  { type: 'human_task', label: 'Human Task', icon: User, color: 'text-yellow-400', bg: 'bg-yellow-500/10', description: 'Manual intervention' },
  { type: 'decision', label: 'Decision', icon: GitBranch, color: 'text-purple-400', bg: 'bg-purple-500/10', description: 'Conditional branch' },
  { type: 'subprocess', label: 'Subprocess', icon: Workflow, color: 'text-indigo-400', bg: 'bg-indigo-500/10', description: 'Nested workflow' },
  { type: 'ai_skill', label: 'AI Skill', icon: Sparkles, color: 'text-pink-400', bg: 'bg-pink-500/10', description: 'AI-powered task' },
];

export const NodePalette: React.FC<NodePaletteProps> = ({ onClose }) => {
  const onDragStart = (event: React.DragEvent<HTMLDivElement>, nodeType: string, label: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/reactflow-label', label);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-64 h-full bg-gray-800 border-r border-gray-700 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
          Node Palette
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1 text-gray-400 hover:text-white rounded"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="space-y-2">
        {nodeTypes.map((node) => {
          const Icon = node.icon;
          
          return (
            <motion.div
              key={node.type}
              whileHover={{ scale: 1.02, x: 2 }}
              whileTap={{ scale: 0.98 }}
              className={`flex items-center space-x-3 p-3 ${node.bg} rounded-lg cursor-grab active:cursor-grabbing border border-transparent hover:border-gray-600 transition-all`}
            >
              {/* ✅ Plain div handles the drag, motion.div handles the animation */}
              <div
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/reactflow', node.type);
                  e.dataTransfer.setData('application/reactflow-label', node.label);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                className="flex items-center space-x-3 w-full"
              >
                <GripVertical className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${node.bg}`}>
                  <Icon className={`w-4 h-4 ${node.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-200">{node.label}</p>
                  <p className="text-xs text-gray-500 truncate">{node.description}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-gray-900 rounded-lg border border-gray-700">
        <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Shortcuts</h4>
        <ul className="text-xs text-gray-500 space-y-1">
          <li>• Drag nodes to canvas</li>
          <li>• Connect via handles</li>
          <li>• Click to configure</li>
          <li>• Delete/Backspace to remove</li>
          <li>• Ctrl+S to save</li>
        </ul>
      </div>
    </div>
  )
};