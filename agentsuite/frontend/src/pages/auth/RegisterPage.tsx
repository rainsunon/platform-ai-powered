import React from 'react';
import { motion } from 'framer-motion';
import { Bot, Zap, Shield, Globe } from 'lucide-react';
import { RegisterForm } from './RegisterForm';

export const RegisterPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4"
          >
            <Bot className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Start Building Your Digital Workforce
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Free 14-day trial. No credit card required.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start max-w-5xl mx-auto">
          <div className="flex-1">
            <RegisterForm />
          </div>

          <div className="lg:w-80 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
            >
              <Zap className="w-8 h-8 text-yellow-500 mb-3" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Quick Setup
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get started in minutes with our guided setup wizard
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
            >
              <Shield className="w-8 h-8 text-green-500 mb-3" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Enterprise Security
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                SOC 2 compliant, encrypted data, role-based access control
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
            >
              <Globe className="w-8 h-8 text-blue-500 mb-3" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Global Scale
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Deploy across multiple regions with automatic scaling
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};