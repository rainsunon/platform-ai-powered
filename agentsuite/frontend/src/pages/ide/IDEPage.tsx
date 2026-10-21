import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ReactFlowProvider } from '@xyflow/react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { CircuitBoard } from '../../components/ide/CircuitBoard';
import { useWorkflowStore } from '../../stores/workflows.store';

export const IDEPage: React.FC = () => {
  const { workflowId } = useParams<{ workflowId?: string }>();
  const navigate = useNavigate();
  const { currentWorkflow, isLoading, error, loadWorkflow, clearWorkflow } = useWorkflowStore();

  useEffect(() => {
    if (workflowId) {
      loadWorkflow(workflowId);
    }
    return () => clearWorkflow();
  }, [workflowId]);

  if (!workflowId) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No Workflow Selected</h2>
          <p className="text-gray-400 mb-4">Select a workflow to edit in the Circuit IDE</p>
          <button
            onClick={() => navigate('/workflows')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Workflows
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading workflow...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Error Loading Workflow</h2>
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => navigate('/workflows')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Workflows
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Breadcrumb Bar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center space-x-4 flex-shrink-0">
        <button
          onClick={() => navigate('/workflows')}
          className="flex items-center text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          <span className="text-sm">Workflows</span>
        </button>
        <span className="text-gray-600">/</span>
        <span className="text-sm text-white font-medium">
          {currentWorkflow?.name || 'Untitled'}
        </span>
        {currentWorkflow && (
          <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
            currentWorkflow.status === 'active' ? 'bg-green-900/30 text-green-400' :
            currentWorkflow.status === 'draft' ? 'bg-yellow-900/30 text-yellow-400' :
            'bg-gray-700 text-gray-400'
          }`}>
            {currentWorkflow.status}
          </span>
        )}
      </div>

      {/* Circuit Board */}
      <div className="flex-1">
        <ReactFlowProvider>
          <CircuitBoard />
        </ReactFlowProvider>
      </div>
    </div>
  );
};