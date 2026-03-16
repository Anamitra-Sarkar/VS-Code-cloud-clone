'use client';

import { motion } from 'framer-motion';
import { Cloud, Bot, Users, GitBranch, Shield, Zap } from 'lucide-react';

const features = [
  {
    icon: Cloud,
    title: 'Cloud IDE',
    description:
      'Full VS Code experience in your browser. Access your workspace from any device, anywhere.',
    color: 'text-vscode-accent',
  },
  {
    icon: Bot,
    title: 'AI Assistant',
    description:
      'Built-in AI that understands your codebase. Get intelligent suggestions, fix errors, and write tests.',
    color: 'text-vscode-green',
  },
  {
    icon: Users,
    title: 'Real-time Collaboration',
    description:
      'Code together in real-time. Share your workspace with teammates and pair program seamlessly.',
    color: 'text-vscode-purple',
  },
  {
    icon: GitBranch,
    title: 'Git Integration',
    description:
      'Full Git support built-in. Commit, push, pull, branch, and merge without leaving your editor.',
    color: 'text-vscode-orange',
  },
  {
    icon: Shield,
    title: 'Secure by Default',
    description:
      'Enterprise-grade security with isolated containers, encrypted connections, and access controls.',
    color: 'text-vscode-blue',
  },
  {
    icon: Zap,
    title: 'Instant Setup',
    description:
      'No installation needed. Start coding in seconds with pre-configured environments and templates.',
    color: 'text-vscode-yellow',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function Features() {
  return (
    <section className="relative py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Everything you need to{' '}
            <span className="gradient-text">build</span>
          </h2>
          <p className="text-lg text-vscode-text-muted max-w-2xl mx-auto">
            A complete cloud development platform with all the tools you love, enhanced by AI.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="group glass rounded-xl p-6 hover:bg-white/5 transition-all duration-300 cursor-default"
              whileHover={{ y: -4 }}
            >
              <div
                className={`w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center mb-4 ${feature.color} group-hover:scale-110 transition-transform`}
              >
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-vscode-text-muted leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
