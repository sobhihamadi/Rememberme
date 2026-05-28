import { client } from './Api.client';
import type { AiAskRequest, AiAskResponse } from '../types/Types.chat';

/**
 * POST /api/v1/ai/ask
 *
 * Sends a user message to the AI with vault context.
 * The backend:
 *   1. Loads existing vault items for context
 *   2. Loads conversation history
 *   3. Calls the AI provider (Gemini)
 *   4. Parses the intent (save / retrieve / update / delete / other)
 *   5. Executes the intent against the vault
 *   6. Persists both the user turn and the AI reply
 *   7. Returns the AI's reply text
 *
 * action = "save"     → user clicked "New Vault" button
 * action = "retrieve" → user clicked "My Vault"  button
 */
export async function askAi(payload: AiAskRequest): Promise<AiAskResponse> {
  return client.post<AiAskResponse>('/ai/ask', payload);
}