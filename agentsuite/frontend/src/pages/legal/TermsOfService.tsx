// frontend/src/pages/legal/TermsOfService.tsx
import React from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Zap,
  CreditCard,
  Ban,
  Scale,
} from 'lucide-react';

export const TermsOfService: React.FC = () => {
  const sections = [
    {
      icon: CheckCircle2,
      title: 'Acceptance of Terms',
      content: `By accessing or using the Agentic Automation Suite ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.`,
    },
    {
      icon: FileText,
      title: 'Service Description',
      content: `Agentic Automation Suite provides an AI-powered automation platform that allows users to create, manage, and execute software robots ("bots") and automated workflows. Features include visual workflow design, AI-powered task execution, and human-in-the-loop task management.`,
    },
    {
      icon: Zap,
      title: 'Fair Use Policy',
      content: `Usage is subject to fair use limits based on your subscription plan. Excessive API calls, workflow executions, or bot activities that degrade service for other users may result in throttling. Enterprise plans include dedicated resources.`,
    },
    {
      icon: CreditCard,
      title: 'Payment & Billing',
      content: `Paid plans are billed monthly or annually. You may upgrade or downgrade at any time. Refunds are provided within 14 days of purchase. All fees are in USD unless otherwise stated.`,
    },
    {
      icon: AlertTriangle,
      title: 'Limitation of Liability',
      content: `The Service is provided "as is" without warranties. We are not liable for damages arising from the use of the Service, including but not limited to data loss, service interruptions, or incorrect automation outcomes.`,
    },
    {
      icon: Ban,
      title: 'Prohibited Activities',
      content: `You may not use the Service for illegal activities, spamming, unauthorized access to systems, distributing malware, or any activity that violates applicable laws. We reserve the right to suspend accounts for violations.`,
    },
    {
      icon: Scale,
      title: 'Governing Law',
      content: `These terms are governed by the laws of the State of Delaware, United States. Any disputes shall be resolved through binding arbitration in accordance with the American Arbitration Association rules.`,
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl mb-6">
            <FileText className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Terms of Service
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
                  <div className="flex-shrink-0 w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
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
            Questions?
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Contact us at{' '}
            <a href="mailto:legal@agentsuite.ai" className="text-purple-600 hover:text-purple-500">
              legal@agentsuite.ai
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
};