'use client';

import { motion } from 'framer-motion';

const codeLines = [
  { indent: 0, tokens: [{ text: 'async function', color: '#c586c0' }, { text: ' deploy', color: '#dcdcaa' }, { text: '() {', color: '#cccccc' }] },
  { indent: 1, tokens: [{ text: 'const', color: '#569cd6' }, { text: ' config', color: '#9cdcfe' }, { text: ' = ', color: '#cccccc' }, { text: 'await', color: '#c586c0' }, { text: ' loadConfig', color: '#dcdcaa' }, { text: '();', color: '#cccccc' }] },
  { indent: 1, tokens: [{ text: 'const', color: '#569cd6' }, { text: ' app', color: '#9cdcfe' }, { text: ' = ', color: '#cccccc' }, { text: 'new', color: '#569cd6' }, { text: ' CloudApp', color: '#4ec9b0' }, { text: '(config);', color: '#cccccc' }] },
  { indent: 0, tokens: [] },
  { indent: 1, tokens: [{ text: '// AI-assisted deployment', color: '#6a9955' }] },
  { indent: 1, tokens: [{ text: 'await', color: '#c586c0' }, { text: ' app', color: '#9cdcfe' }, { text: '.', color: '#cccccc' }, { text: 'build', color: '#dcdcaa' }, { text: '();', color: '#cccccc' }] },
  { indent: 1, tokens: [{ text: 'await', color: '#c586c0' }, { text: ' app', color: '#9cdcfe' }, { text: '.', color: '#cccccc' }, { text: 'test', color: '#dcdcaa' }, { text: '();', color: '#cccccc' }] },
  { indent: 1, tokens: [{ text: 'await', color: '#c586c0' }, { text: ' app', color: '#9cdcfe' }, { text: '.', color: '#cccccc' }, { text: 'ship', color: '#dcdcaa' }, { text: '();', color: '#cccccc' }, { text: ' // 🚀', color: '#6a9955' }] },
  { indent: 0, tokens: [{ text: '}', color: '#cccccc' }] },
];

export default function CodeAnimation() {
  return (
    <motion.div
      className="absolute right-10 top-1/2 -translate-y-1/2 hidden xl:block"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 0.3, x: 0 }}
      transition={{ delay: 1, duration: 1 }}
    >
      <div className="font-mono text-xs leading-6 select-none pointer-events-none">
        {codeLines.map((line, i) => (
          <motion.div
            key={i}
            className="whitespace-pre"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2 + i * 0.15, duration: 0.4 }}
            style={{ paddingLeft: `${line.indent * 24}px` }}
          >
            {line.tokens.map((token, j) => (
              <span key={j} style={{ color: token.color }}>
                {token.text}
              </span>
            ))}
            {line.tokens.length === 0 && '\u00A0'}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
