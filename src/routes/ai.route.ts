import { Router } from "express";
import { AiController } from "../controllers/Ai.controller";
import { VaultAiService } from "../services/Vaultaiservice";
import { GeminiProvider } from "../providers/Geminiprovider";
// import { ClaudeProvider } from "../services/ai/ClaudeProvider"; // ← uncomment when upgrading
import { ChatService } from "../services/chat.service";
import { VaultService } from "../services/Vault.service";
import { ChatRepositoryPostgre } from "../repository/PostgreSql/ChatRepositoryPostgre";
import { VaultRepositoryPostgre } from "../repository/PostgreSql/VaultRepositoryPostgre";
import { asyncHandler } from "../middleware/AsyncHandler";
import { Authentication } from "../middleware/auth";
import { hasPermission } from "../middleware/authorize";
import { permissions } from "../config/roles";
import config from "../config";
import { chatRepository, vaultRepository } from "../repository/PostgreSql/repositories";

// ── Dependency wiring ─────────────────────────────────────────────────────────



const chatService  = new ChatService(chatRepository);
const vaultService = new VaultService(vaultRepository);

// ── Provider selection ────────────────────────────────────────────────────────
// Using Gemini (free tier) for development.
// To switch to Claude: comment the GeminiProvider line and uncomment ClaudeProvider.
const aiProvider = new GeminiProvider(config.gemini.apiKey);
// const aiProvider = new ClaudeProvider(config.anthropic.apiKey);

const vaultAiService = new VaultAiService(aiProvider, chatService, vaultService);
const aiController   = new AiController(vaultAiService);

// ── Router ────────────────────────────────────────────────────────────────────

const router = Router();

/**
 * POST /api/v1/ai/ask
 * The main chat endpoint. Receives a user message, queries the AI with
 * vault context + conversation history, saves both turns, returns the reply.
 *
 * Body: { userId, category, type, message }
 */
router.post(
    "/ask",
    Authentication,
    hasPermission(permissions.send_chat_message),
    asyncHandler(aiController.ask)
);

export default router;