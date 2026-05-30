import { useState, useCallback, useEffect, useRef } from 'react';
import { getChatHistory } from '../api/Api.chat';
import { askAi } from '../api/Api.ai';
import {
  type ChatMessageResponse,
  ChatRole,
  type VaultAction,
} from '../types/Types.chat';
import { VaultCategory, VaultItemType } from '../types/Types.vault';
import { ApiException } from '../api/Api.client';

interface ChatState {
  messages: ChatMessageResponse[];
  loading:  boolean;  // true while history is loading
  sending:  boolean;  // true while AI is processing
  error:    string | null;
}

interface UseChatReturn extends ChatState {
  /** Send a message to the AI and receive a reply. */
  send:       (message: string, action: VaultAction) => Promise<void>;
  clearError: () => void;
}

/**
 * useChat
 *
 * Manages the chat window state for a given user / category / type context.
 * On mount (and when context changes) it fetches the full conversation history.
 * `send()` calls POST /api/v1/ai/ask and appends both turns locally so the
 * UI updates immediately — no second fetch needed.
 *
 * Example:
 *   const { messages, sending, send } = useChat(
 *     userId, VaultCategory.WORK, VaultItemType.PASSWORD
 *   );
 *   // user clicks "send":
 *   await send("What's my GitHub SSH key?", 'retrieve');
 */
export function useChat(
  userId:   string | null,
  category: VaultCategory | null,
  type:     VaultItemType | null,
): UseChatReturn {
  const [state, setState] = useState<ChatState>({
    messages: [],
    loading:  false,
    sending:  false,
    error:    null,
  });

  // Track the current context so stale async callbacks don't update wrong state
  const contextRef = useRef({ userId, category, type });
  useEffect(() => {
    contextRef.current = { userId, category, type };
  }, [userId, category, type]);

  const clearError = useCallback(() =>
    setState((prev) => ({ ...prev, error: null })), []);

  // ── Load history when context changes ─────────────────────────────────────

  useEffect(() => {
    if (!userId || !category || !type) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    getChatHistory(userId, category, type)
      .then((messages) => {
        // Guard: only update if the context hasn't changed mid-flight
        if (
          contextRef.current.userId   === userId &&
          contextRef.current.category === category &&
          contextRef.current.type     === type
        ) {
          setState({ messages, loading: false, sending: false, error: null });
        }
      })
      .catch((err) => {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof ApiException ? err.message : 'Failed to load chat history',
        }));
      });
  }, [userId, category, type]);

  // ── send ──────────────────────────────────────────────────────────────────

  const send = useCallback(async (message: string, action: VaultAction) => {
    if (!userId || !category || !type) return;

    // Optimistically append the user's message so the UI feels instant
    const optimisticUserMsg: ChatMessageResponse = {
      id:              `optimistic-${Date.now()}`,
      userId,
      content:         message,
      role:            ChatRole.USER,
      categoryContext: category,
      typeContext:     type,
      createdAt:       new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, optimisticUserMsg],
      sending:  true,
      error:    null,
    }));

    try {
      // Ask the AI — backend saves both turns and returns only the reply text
      const { reply } = await askAi({ userId, category, type, action, message });

      // Build the AI message object for local display
      const aiMsg: ChatMessageResponse = {
        id:              `ai-${Date.now()}`,
        userId,
        content:         reply,
        role:            ChatRole.AI,
        categoryContext: category,
        typeContext:     type,
        createdAt:       new Date().toISOString(),
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, aiMsg],
        sending:  false,
      }));
    } catch (err) {
      // Roll back the optimistic message on error
      setState((prev) => ({
        ...prev,
        messages: prev.messages.filter((m) => m.id !== optimisticUserMsg.id),
        sending:  false,
        error:    err instanceof ApiException ? err.message : 'Failed to send message',
      }));
      throw err;
    }
  }, [userId, category, type]);

  return { ...state, send, clearError };
}