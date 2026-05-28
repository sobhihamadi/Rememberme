import { VaultCategory, VaultItemType } from './Types.vault';

// ── Mirrors backend ChatRole enum ─────────────────────────────────────────────

export const ChatRole = {
  USER: 'USER',
  AI:   'AI',
} as const;

export type ChatRole = typeof ChatRole[keyof typeof ChatRole];

// ── Chat message shapes ───────────────────────────────────────────────────────

/** What the API returns for a single chat message */
export interface ChatMessageResponse {
  id:              string;
  userId:          string;
  content:         string;
  role:            ChatRole;
  categoryContext: VaultCategory;
  typeContext:     VaultItemType;
  createdAt:       string;
}

/** What we send to save a chat message */
export interface CreateChatMessageRequest {
  userId:           string;
  content:          string;
  role:             ChatRole;
  categoryContext?: VaultCategory;
  typeContext?:     VaultItemType;
}

// ── AI ask shapes ─────────────────────────────────────────────────────────────

export type VaultAction = 'save' | 'retrieve';

/** What we send to POST /api/v1/ai/ask */
export interface AiAskRequest {
  userId:   string;
  category: VaultCategory;
  type:     VaultItemType;
  action:   VaultAction;
  message:  string;
}

/** What the AI endpoint returns */
export interface AiAskResponse {
  reply: string;
}

// ── Formatted history (shaped for AI context) ─────────────────────────────────

export interface FormattedHistoryEntry {
  role:    'user' | 'assistant';
  content: string;
}