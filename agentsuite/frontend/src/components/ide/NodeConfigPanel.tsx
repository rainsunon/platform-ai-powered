import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Node } from '@xyflow/react';
import { X, Save, Settings, Code, Database, Clock, RotateCcw, Trash2 } from 'lucide-react';

interface NodeConfigPanelProps {
  node: Node;
  onClose: () => void;
  onUpdate: (node: Node) => void;
  onDelete?: (nodeId: string) => void;
}

export const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({ 
  node, 
  onClose, 
  onUpdate,
  onDelete 
}) => {
  const [label, setLabel] = useState((node.data as any).label || '');
  const [description, setDescription] = useState((node.data as any).description || '');
  const [config, setConfig] = useState<Record<string, any>>((node.data as any).config || {});
  const [activeTab, setActiveTab] = useState('general');
  const previousNodeId = useRef(node.id);

  // ✅ Auto-save when switching to a different node
  useEffect(() => {
    if (previousNodeId.current !== node.id) {
      // Save the previous node's changes before loading the new one
      const prevNode = { ...node, id: previousNodeId.current };
      if (label || description || Object.keys(config).length > 0) {
        const savedNode: Node = {
          ...prevNode,
          data: {
            ...prevNode.data,
            label: label || (prevNode.data as any)?.label || 'Untitled',
            description: description || (prevNode.data as any)?.description || '',
            config: { ...config },
          },
        };
        onUpdate(savedNode);
      }
      
      // Now load the new node's data
      previousNodeId.current = node.id;
      setLabel((node.data as any).label || '');
      setDescription((node.data as any).description || '');
      setConfig((node.data as any).config || {});
    }
  }, [node.id]);

  // ✅ Also auto-save when closing the panel
  const handleClose = () => {
    const updatedNode: Node = {
      ...node,
      data: {
        ...node.data,
        label: label || 'Untitled',
        description: description || '',
        config: { ...config },
      },
    };
    onUpdate(updatedNode);
  };

  const handleApply = () => {
    const updatedNode: Node = {
      ...node,
      data: {
        ...node.data,
        label: label || 'Untitled',
        description: description || '',
        config: { ...config },
      },
    };
    onUpdate(updatedNode);
    // ✅ Don't close - let user continue editing
  };

  const updateConfig = (key: string, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'advanced', label: 'Advanced', icon: Code },
    { id: 'data', label: 'Data Mapping', icon: Database },
    { id: 'timeout', label: 'Timeout & Retry', icon: Clock },
  ];

  const nodeData = node.data as any;
  const nodeType = nodeData.type || 'task';

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: 'spring', damping: 25 }}
      className="w-80 lg:w-96 bg-gray-800 border-l border-gray-700 flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
        <div className="min-w-0 flex-1 mr-2">
          <h3 className="text-lg font-semibold text-white truncate">Node Configuration</h3>
          <p className="text-sm text-gray-400 truncate">{label || nodeData.label || 'Untitled'}</p>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0">
          {onDelete && (
            <button
              onClick={() => onDelete(node.id)}
              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
              title="Delete node"
            >
              <Trash2 size={16} />
            </button>
          )}
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700 flex-shrink-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-1 px-2 py-2.5 text-xs sm:text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-400/5'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content - same as before, no changes needed here */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'general' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Node Label
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Enter node label..."
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this node does..."
                rows={3}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {nodeType === 'ai_skill' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Skill Name
                </label>
                <select
                  value={config.skillName || ''}
                  onChange={(e) => updateConfig('skillName', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select skill...</option>
                  <option value="extract_invoice">Extract Invoice Data</option>
                  <option value="classify_document">Classify Document</option>
                  <option value="summarize_text">Summarize Text</option>
                  <option value="translate_content">Translate Content</option>
                  <option value="sentiment_analysis">Sentiment Analysis</option>
                  <option value="data_validation">Data Validation</option>
                </select>
              </div>
            )}

            {nodeType === 'human_task' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Assignment
                </label>
                <select
                  value={config.assignment || 'any'}
                  onChange={(e) => updateConfig('assignment', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="any">Any available operator</option>
                  <option value="specific">Specific user</option>
                  <option value="role">By role</option>
                  <option value="round_robin">Round robin</option>
                </select>
              </div>
            )}

            {nodeType === 'decision' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Condition
              </label>
              <select
                value={config.condition || 'amount > 1000'}
                onChange={(e) => updateConfig('condition', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="amount > 1000">Amount &gt; $1,000</option>
                <option value="amount > 5000">Amount &gt; $5,000</option>
                <option value="amount > 10000">Amount &gt; $10,000</option>
                <option value="amount < 1000">Amount &lt; $1,000</option>
                <option value="true">Always True (test YES)</option>
                <option value="false">Always False (test NO)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">First edge = YES path, Second edge = NO path</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Compare Field
              </label>
              <input
                type="text"
                value={config.compareField || 'amount'}
                onChange={(e) => updateConfig('compareField', e.target.value)}
                placeholder="amount"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="p-3 bg-yellow-900/20 border border-yellow-700 rounded-lg">
              <p className="text-xs text-yellow-300 font-medium mb-1">💡 How branching works:</p>
              <ul className="text-xs text-yellow-200 space-y-1">
                <li>• Connect <strong>first edge</strong> → YES path (condition is true)</li>
                <li>• Connect <strong>second edge</strong> → NO path (condition is false)</li>
                <li>• Label edges "YES" and "NO" for clarity</li>
                <li>• Amount is extracted from AI Skill or description</li>
              </ul>
            </div>
          </>
        )}

            {nodeType === 'task' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Task Type
                  </label>
                  <select
                    value={config.taskType || 'generic'}
                    onChange={(e) => updateConfig('taskType', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="generic">Generic Task</option>
                    <option value="web_scrape">Web Scraping</option>
                    <option value="api_call">API Call</option>
                    <option value="file_process">File Processing</option>
                    <option value="email_send">Send Email</option>
                  </select>
                </div>

                {/* Email-specific fields */}
                {config.taskType === 'email_send' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Recipient Email
                      </label>
                      <input
                        type="email"
                        value={config.toEmail || ''}
                        onChange={(e) => updateConfig('toEmail', e.target.value)}
                        placeholder="recipient@example.com"
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Subject
                      </label>
                      <input
                        type="text"
                        value={config.subject || ''}
                        onChange={(e) => updateConfig('subject', e.target.value)}
                        placeholder="Email subject"
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Body
                      </label>
                      <textarea
                        value={config.body || ''}
                        onChange={(e) => updateConfig('body', e.target.value)}
                        placeholder="Email body..."
                        rows={4}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Priority
              </label>
              <select
                value={config.priority || 'medium'}
                onChange={(e) => updateConfig('priority', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Execution Mode
              </label>
              <select
                value={config.executionMode || 'sync'}
                onChange={(e) => updateConfig('executionMode', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="sync">Synchronous</option>
                <option value="async">Asynchronous</option>
                <option value="parallel">Parallel</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Input Mapping
              </label>
              <textarea
                value={config.inputMapping ? JSON.stringify(config.inputMapping, null, 2) : ''}
                onChange={(e) => {
                  try { updateConfig('inputMapping', JSON.parse(e.target.value)); }
                  catch { updateConfig('inputMapping', e.target.value); }
                }}
                placeholder='{"sourceField": "targetField"}'
                rows={4}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 resize-none font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Output Mapping
              </label>
              <textarea
                value={config.outputMapping ? JSON.stringify(config.outputMapping, null, 2) : ''}
                onChange={(e) => {
                  try { updateConfig('outputMapping', JSON.parse(e.target.value)); }
                  catch { updateConfig('outputMapping', e.target.value); }
                }}
                placeholder='{"resultField": "nextStepField"}'
                rows={4}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 resize-none font-mono text-xs"
              />
            </div>
          </div>
        )}

        {activeTab === 'timeout' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Timeout (seconds)
              </label>
              <input
                type="number"
                value={config.timeout ?? 300}
                onChange={(e) => updateConfig('timeout', parseInt(e.target.value) || 300)}
                min={1} max={3600}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Max Retries
              </label>
              <input
                type="number"
                value={config.maxRetries ?? 3}
                onChange={(e) => updateConfig('maxRetries', parseInt(e.target.value) || 0)}
                min={0} max={10}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Retry Delay (seconds)
              </label>
              <input
                type="number"
                value={config.retryDelay ?? 5}
                onChange={(e) => updateConfig('retryDelay', parseInt(e.target.value) || 5)}
                min={1} max={300}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-700 p-4 flex-shrink-0">
        <div className="flex space-x-2">
          <button
            onClick={handleApply}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
          >
            <Save size={16} className="mr-2" />
            Apply Changes
          </button>
          <button
            onClick={() => {
              setLabel((node.data as any).label || '');
              setDescription((node.data as any).description || '');
              setConfig((node.data as any).config || {});
            }}
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
            title="Reset changes"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};