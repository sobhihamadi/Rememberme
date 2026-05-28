import { client } from './Api.client';
import {
  VaultCategory,
  VaultItemType,
} from '../types/Types.vault';
import type {
    ChatMessageResponse,
    CreateChatMessageRequest,
    FormattedHistoryEntry,
} from '../types/Types.chat';

/**
 * GET /api/v1/chat?userId=&category=&type=
 * Loads the full ordered conversation for a vault context.
 * Call on component mount to hydrate the chat window.
 */
export async function getChatHistory(
  userId:   string,
  category: VaultCategory,
  type:     VaultItemType,
): Promise<ChatMessageResponse[]> {
  const params = new URLSearchParams({ userId, category, type });
  return client.get<ChatMessageResponse[]>(`/chat?${params.toString()}`);
}

/**
 * GET /api/v1/chat/formatted?userId=&category=&type=
 * Returns history shaped for the AI API messages array:
 * [{ role: "user" | "assistant", content: string }]
 */
export async function getFormattedHistory(
  userId:   string,
  category: VaultCategory,
  type:     VaultItemType,
): Promise<FormattedHistoryEntry[]> {
  const params = new URLSearchParams({ userId, category, type });
  return client.get<FormattedHistoryEntry[]>(`/chat/formatted?${params.toString()}`);
}

/**
 * POST /api/v1/chat
 * Saves one turn of the conversation (user message or AI response).
 * The frontend calls this twice per exchange — once for the user turn,
 * once after receiving the AI reply.
 */
export async function createChatMessage(
  payload: CreateChatMessageRequest,
): Promise<ChatMessageResponse> {
  return client.post<ChatMessageResponse>('/chat', payload);
}