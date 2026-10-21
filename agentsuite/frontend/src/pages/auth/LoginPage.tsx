import React from 'react';
import { motion } from 'framer-motion';
import { Bot, Sparkles } from 'lucide-react';
import { LoginForm } from './LoginForm';

export const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-purple-600 items-center justify-center p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center text-white"
        >
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{ 
              duration: 4,
              repeat: Infinity,
              repeatType: "reverse",
            }}
            className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-8 backdrop-blur-lg"
          >
            <Bot className="w-12 h-12" />
          </motion.div>
          
          <h1 className="text-5xl font-bold mb-4">
            AgentSuite
          </h1>
          <p className="text-xl text-blue-100 mb-8">
            Intelligent Digital Workforce Platform
          </p>
          
          <div className="grid grid-cols-3 gap-6 max-w-md mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold mb-1">10x</div>
              <div className="text-sm text-blue-200">Faster Processes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-1">99.9%</div>
              <div className="text-sm text-blue-200">Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-1">24/7</div>
              <div className="text-sm text-blue-200">Operation</div>
            </div>
          </div>

          <div className="mt-12 flex items-center justify-center space-x-2 text-blue-200">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm">Powered by Advanced AI</span>
          </div>
        </motion.div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <Bot className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              AgentSuite
            </h1>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
};