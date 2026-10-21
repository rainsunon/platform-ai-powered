import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Grid, List, Plus, SlidersHorizontal } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { botsService } from '../../services/bots.service';
import { BotCard } from './BotCard';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { EmptyState } from '../common/EmptyState';
import { Bot } from '../../types/bot';

interface BotListProps {
  onSelectBot: (bot: Bot) => void;
}

export const BotList: React.FC<BotListProps> = ({ onSelectBot }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['bots', statusFilter, typeFilter],
    queryFn: () => botsService.listBots({
      status: statusFilter !== 'all' ? statusFilter : undefined,
      type: typeFilter !== 'all' ? typeFilter : undefined,
    }),
  });

  const filteredBots = data?.data.filter(bot =>
    bot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bot.type.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleStart = async (id: string) => {
    try {
      await botsService.startBot(id);
      refetch();
    } catch (error) {
      console.error('Failed to start bot:', error);
    }
  };

  const handleStop = async (id: string) => {
    try {
      await botsService.stopBot(id);
      refetch();
    } catch (error) {
      console.error('Failed to stop bot:', error);
    }
  };

  const handleRestart = async (id: string) => {
    try {
      await botsService.restartBot(id);
      refetch();
    } catch (error) {
      console.error('Failed to restart bot:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this bot?')) return;
    try {
      await botsService.deleteBot(id);
      refetch();
    } catch (error) {
      console.error('Failed to delete bot:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bots..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300"
        >
          <option value="all">All Status</option>
          <option value="idle">Idle</option>
          <option value="running">Running</option>
          <option value="error">Error</option>
          <option value="offline">Offline</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300"
        >
          <option value="all">All Types</option>
          <option value="web">Web</option>
          <option value="desktop">Desktop</option>
          <option value="api">API</option>
          <option value="ai_agent">AI Agent</option>
        </select>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg ${
              viewMode === 'grid' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Grid size={18} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg ${
              viewMode === 'list' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <List size={18} />
          </button>
        </div>

        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
          <Plus size={18} />
          <span>New Bot</span>
        </button>
      </div>

      {/* Bot Grid/List */}
      {isLoading ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {[...Array(6)].map((_, i) => (
            <LoadingSkeleton key={i} type="card" />
          ))}
        </div>
      ) : filteredBots.length === 0 ? (
        <EmptyState
          title="No bots found"
          description="Create your first bot to start automating tasks"
          action={{
            label: 'Create Bot',
            onClick: () => console.log('Create bot clicked'),
          }}
        />
      ) : (
        <motion.div
          layout
          className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}
        >
          <AnimatePresence>
            {filteredBots.map((bot) => (
              <BotCard
                key={bot.id}
                bot={bot}
                onStart={handleStart}
                onStop={handleStop}
                onRestart={handleRestart}
                onDelete={handleDelete}
                onClick={onSelectBot}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};