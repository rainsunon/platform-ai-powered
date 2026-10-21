// frontend/src/pages/legal/PrivacyPolicy.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Database, Share2, Cookie } from 'lucide-react';

export const PrivacyPolicy: React.FC = () => {
  const sections = [
    {
      icon: Shield,
      title: 'Information We Collect',
      content: `We collect information you provide directly, such as your name, email address, and company name when you create an account. We also collect automation workflow data, bot configurations, and execution logs to provide our services.`,
    },
    {
      icon: Database,
      title: 'How We Use Your Data',
      content: `Your data is used to provide, maintain, and improve the Agentic Automation Suite. This includes executing your workflows, managing your bot fleet, generating analytics, and sending notifications. We do not sell your data to third parties.`,
    },
    {
      icon: Lock,
      title: 'Data Security',
      content: `We implement industry-standard security measures including encryption at rest (AES-256) and in transit (TLS 1.3), multi-factor authentication, regular security audits, and role-based access controls. Your credentials are hashed using Argon2id.`,
    },
    {
      icon: Eye,
      title: 'Data Access & Control',
      content: `You have full control over your data. You can export, update, or delete your data at any time through the platform. Workflow definitions, bot configurations, and execution history can be managed from your dashboard.`,
    },
    {
      icon: Share2,
      title: 'Third-Party Services',
      content: `We integrate with AI providers (OpenAI, Anthropic, Google) for AI-powered automation features. Data sent to these services is governed by their respective privacy policies. We recommend reviewing their policies before using AI features.`,
    },
    {
      icon: Cookie,
      title: 'Cookies & Tracking',
      content: `We use essential cookies for authentication and session management. Analytics cookies help us understand platform usage and improve our services. You can disable non-essential cookies in your browser settings.`,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl mb-6">
            <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Last updated: January 2026
          </p>
        </motion.div>

        <div className="space-y-6">
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                      {section.title}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {section.content}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm text-center"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Contact Us
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            If you have questions about this privacy policy, please contact us at{' '}
            <a href="mailto:privacy@agentsuite.ai" className="text-blue-600 hover:text-blue-500">
              privacy@agentsuite.ai
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
};