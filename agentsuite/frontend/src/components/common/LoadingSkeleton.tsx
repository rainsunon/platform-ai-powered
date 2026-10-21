import React from 'react';

interface LoadingSkeletonProps {
  type?: 'card' | 'list' | 'table' | 'page' | 'text' | 'chart';
  count?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ type = 'text', count = 1 }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg skeleton" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded skeleton w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded skeleton w-1/2" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-1">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded skeleton w-1/2" />
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded skeleton w-3/4" />
                </div>
              ))}
            </div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg skeleton" />
          </div>
        );

      case 'list':
        return (
          <div className="space-y-3">
            {[...Array(count)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full skeleton flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded skeleton w-1/3" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded skeleton w-1/2" />
                </div>
                <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full skeleton" />
              </div>
            ))}
          </div>
        );

      case 'table':
        return (
          <div className="space-y-3">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded skeleton" />
            {[...Array(count)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded skeleton" />
            ))}
          </div>
        );

      case 'page':
        return (
          <div className="space-y-6 p-8">
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded skeleton w-1/4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded skeleton w-1/3" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl skeleton" />
              ))}
            </div>
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl skeleton" />
          </div>
        );

      case 'chart':
        return (
          <div className="space-y-4 p-6 bg-white dark:bg-gray-800 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded skeleton w-1/4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded skeleton w-1/6" />
            </div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded skeleton" />
          </div>
        );

      case 'text':
      default:
        return (
          <div className="space-y-2">
            {[...Array(count)].map((_, i) => (
              <div
                key={i}
                className="h-4 bg-gray-200 dark:bg-gray-700 rounded skeleton"
                style={{ width: `${Math.random() * 40 + 60}%` }}
              />
            ))}
          </div>
        );
    }
  };

  return <>{renderSkeleton()}</>;
};