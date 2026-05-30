import { Router } from "express";
import { ChatController } from "../controllers/chat.controller";
import { ChatService } from "../services/chat.service";
import { ChatRepositoryPostgre } from "../repository/PostgreSql/ChatRepositoryPostgre";
import { asyncHandler } from "../middleware/AsyncHandler";
import { Authentication } from "../middleware/auth";
import { hasPermission } from "../middleware/authorize";
import { permissions } from "../config/roles";
import { chatRepository } from "../repository/PostgreSql/repositories";

// ── Dependency wiring ─────────────────────────────────────────────────────────



const chatService    = new ChatService(chatRepository);
const chatController = new ChatController(chatService);

// ── Router ────────────────────────────────────────────────────────────────────

const router = Router();

router.use(Authentication);

/**
 * POST /api/v1/chat
 * Saves one turn of the conversation (user message or AI response).
 * The frontend calls this twice per exchange — once for the user turn,
 * once after receiving the AI response.
 *
 * GET /api/v1/chat?userId=&category=&type=
 * Loads the full ordered conversation for a vault context.
 * Called on mount to hydrate the chat window.
 */
router
    .route("/")
    .post(
        hasPermission(permissions.send_chat_message),
        asyncHandler(chatController.createMessage)
    )
    .get(
        hasPermission(permissions.read_chat_history),
        asyncHandler(chatController.getChatContext)
    );

/**
 * GET /api/v1/chat/formatted?userId=&category=&type=
 * Returns history shaped for the Claude API messages array.
 * Must be defined BEFORE /:id so Express doesn't treat "formatted" as an id param.
 */
router.get(
    "/formatted",
    hasPermission(permissions.read_chat_history),
    asyncHandler(chatController.getFormattedHistory)
);

export default router;