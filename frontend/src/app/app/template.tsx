'use client';

import { motion } from 'framer-motion';
import { pageEnter } from '@/lib/motion';

/** Page change: content fades in with a 4px rise. The shell never animates. */
export default function WorkspaceTemplate({ children }: { children: React.ReactNode }) {
  return <motion.div {...pageEnter}>{children}</motion.div>;
}
