/**
 * MessageBubble — shared chat message bubble component.
 *
 * Canonical version: FanAssistantPage.tsx (uses Framer Motion with
 * useReducedMotion() for accessibility compliance).
 */
import { useReducedMotion } from 'framer-motion';
import { motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';
import type { ChatMessage } from '../../types';
import { BUBBLE_VARIANTS } from './constants';

export function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';
  const shouldReduceMotion = useReducedMotion() ?? false;

  return (
    <motion.div
      variants={shouldReduceMotion ? {} : BUBBLE_VARIANTS}
      initial="hidden"
      animate="visible"
      transition={{ duration: shouldReduceMotion ? 0 : 0.2, ease: 'easeOut' }}
      className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      role="listitem"
    >
      <div
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
          isUser ? 'bg-pitch-blue' : 'bg-stadium-green/10'
        }`}
        aria-hidden="true"
      >
        {isUser ? (
          <User className="h-4 w-4 text-text-primary" />
        ) : (
          <Bot className="h-4 w-4 text-stadium-green" />
        )}
      </div>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-body-sm leading-relaxed ${
          isUser
            ? 'rounded-br-sm bg-pitch-blue text-white'
            : 'rounded-bl-sm bg-gray-100 text-text-primary'
        }`}
      >
        {msg.content}
      </div>
    </motion.div>
  );
}
