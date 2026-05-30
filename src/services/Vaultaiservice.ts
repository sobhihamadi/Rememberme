import { IAiProvider } from "../providers/Iaiprovider";
import { ChatService } from "../services/chat.service";
import { VaultService } from "../services/Vault.service";
import { ChatRole } from "../model/IChatMessage.model";
import { VaultCategory, VaultItemType } from "../model/IVaultItem.model";
import { IdentifierChatMessage } from "../model/ChatMessage.model";
import { IdentifierVaultItem } from "../model/VaultItem.model";
import logger from "../util/logger";

export type VaultAction = "save" | "retrieve";

// ── Intent shapes ─────────────────────────────────────────────────────────────

interface SaveIntent {
    intent:  "save";
    label:   string;
    content: string;
    reply:   string;
}
interface RetrieveIntent {
    intent: "retrieve";
    reply:  string;
}
interface UpdateIntent {
    intent:     "update";
    label:      string;
    newContent: string;
    reply:      string;
}
interface DeleteIntent {
    intent: "delete";
    label:  string;
    reply:  string;
}
interface OtherIntent {
    intent: "other";
    reply:  string;
}

type AiIntent =
    | SaveIntent
    | RetrieveIntent
    | UpdateIntent
    | DeleteIntent
    | OtherIntent;

// ── Type guidance — tells the AI what content to expect ───────────────────────

/**
 * Describes each VaultItemType so the AI knows:
 * - what kind of content the user is likely to provide
 * - how to generate a good label
 * - which save trigger phrases to listen for
 */
const TYPE_GUIDANCE: Record<VaultItemType, {
    description:     string;
    labelHint:       string;
    contentHint:     string;
    savePhrases:     string;
    retrievePhrases: string;
}> = {
    [VaultItemType.PASSWORD]: {
        description:     "password or secret credential",
        labelHint:       "e.g. Netflix Password, Gmail Password, WiFi Password",
        contentHint:     "the exact password or secret string",
        savePhrases:     "save, remember, store, my password is, the password is",
        retrievePhrases: "what is, give me, show me, what's my, I want, tell me",
    },
    [VaultItemType.CODE]: {
        description:     "code snippet, function, or script",
        labelHint:       "e.g. Login Function, Docker Build Script, API Call",
        contentHint:     "the full code block — preserve all whitespace and formatting",
        savePhrases:     "save, remember, store this code, save this function, save this script",
        retrievePhrases: "give me, show me, what's, I need, retrieve, find",
    },
    [VaultItemType.COMMAND]: {
        description:     "terminal or CLI command",
        labelHint:       "e.g. Docker Prune Command, Git Reset, SSH Login",
        contentHint:     "the exact command string, including all flags",
        savePhrases:     "save, remember, store this command, save this",
        retrievePhrases: "give me, what's, show me, how do I, what was, find",
    },
    [VaultItemType.NOTE]: {
        description:     "note, reminder, or piece of information",
        labelHint:       "e.g. Meeting Notes, Doctor Appointment, Idea",
        contentHint:     "the full text of the note",
        savePhrases:     "save, remember, note this, write this down, store",
        retrievePhrases: "what did I, remind me, show me, find my, what's my",
    },
};

// ── Personality layer — injected into every system prompt ─────────────────────

/**
 * Shared personality instruction added to the top of every system prompt.
 * Keeps tone fun and engaging without affecting the JSON structure.
 *
 * IMPORTANT: emojis and humor belong ONLY in the "reply" field.
 * The "label", "content", "intent", and "newContent" fields must stay
 * clean and structured — personality never bleeds into those.
 */
const PERSONALITY_PREFIX = `
PERSONALITY & TONE:
You are VaultMind — part security guardian, part witty friend.
Your personality rules:
- Use light humor and warmth in every reply. Think of yourself as a helpful 
  friend who happens to be a cybersecurity expert.
- Use 1-2 relevant emojis per reply (placed naturally, not forced).
  Good examples: 🔐 for saving/security, 🎉 for success, 🤔 for confusion,
  🗑️ for delete, ✏️ for update, 📋 for listing, 👀 for retrieving.
- Keep replies SHORT and punchy — one or two sentences max.
- Humor must be gentle and work-safe. No sarcasm that could feel mean.
- Personality applies ONLY to the "reply" field in your JSON output.
  Never put emojis or jokes in "label", "content", or "newContent" fields —
  those must remain clean and exact.

Example reply styles:
  Save success:    "Done! 🔐 Your Netflix Password is locked up tighter than Fort Knox."
  Retrieve:        "Here you go! 👀 Your Netflix Password is: Sup3rS3cret! — enjoy the binge."
  Update success:  "Updated! ✏️ Your Netflix Password has a fresh new look. Much better."
  Delete success:  "Gone! 🗑️ Your Netflix Password has been vaporized. No trace left."
  Not found:       "Hmm, I searched everywhere but couldn't find that one. 🤔 Did you mean one of: [labels]?"
  Empty vault:     "Your vault is empty! 🏜️ Switch to New Vault to start filling it up."
  Greeting:        "Hey there! 👋 What secret shall I guard for you today?"
`.trim();

// ─────────────────────────────────────────────────────────────────────────────

export class VaultAiService {
    constructor(
        private readonly aiProvider:   IAiProvider,
        private readonly chatService:  ChatService,
        private readonly vaultService: VaultService
    ) {}

    public async ask(
        userId:      string,
        category:    VaultCategory,
        type:        VaultItemType,
        action:      VaultAction,
        userMessage: string
    ): Promise<string> {

        // ── 1. Load existing vault items ──────────────────────────────────
        const vaultItems = await this.vaultService.getItemsByContext(
            userId, category, type
        );

        const vaultContext = vaultItems.length > 0
            ? vaultItems
                .map((i) => `- ${i.getLabel()}: ${i.getContent()}`)
                .join("\n")
            : "No items saved yet.";

        // ── 2. Load conversation history ──────────────────────────────────
        const history = await this.chatService.constructSystemPromptAndHistory(
            userId, category, type
        );

        // ── 3. Pick system prompt ─────────────────────────────────────────
        const systemPrompt = action === "save"
            ? this.buildSavePrompt(type, vaultContext)
            : this.buildRetrievePrompt(type, vaultContext);

        // ── 4. Call AI ────────────────────────────────────────────────────
        const rawResponse = await this.aiProvider.chat(
            systemPrompt, history, userMessage
        );

        // ── 5. Parse response ─────────────────────────────────────────────
        let parsed: AiIntent;
        try {
            const cleaned = rawResponse
                .replace(/```json/gi, "")
                .replace(/```/g, "")
                .trim();
            parsed = JSON.parse(cleaned);
        } catch {
            logger.warn("VaultAiService: non-JSON AI response, treating as plain text");
            parsed = { intent: "other", reply: rawResponse };
        }

        // ── 6. Execute intent ─────────────────────────────────────────────
        const replyToUser = await this.executeIntent(
            parsed, userId, category, type, vaultItems
        );

        // ── 7. Persist both turns ─────────────────────────────────────────
        await this.chatService.createMessage(
            IdentifierChatMessage.create({
                userId,
                content:         userMessage,
                role:            ChatRole.USER,
                categoryContext: category,
                typeContext:     type,
            })
        );
        await this.chatService.createMessage(
            IdentifierChatMessage.create({
                userId,
                content:         replyToUser,
                role:            ChatRole.AI,
                categoryContext: category,
                typeContext:     type,
            })
        );

        return replyToUser;
    }

    // ── System prompts ────────────────────────────────────────────────────────

    private buildSavePrompt(type: VaultItemType, vaultContext: string): string {
        const g = TYPE_GUIDANCE[type];

        return `
${PERSONALITY_PREFIX}

---

You are VaultMind, a secure AI vault assistant.
The user is in SAVE mode. They want to store a new ${g.description}.

Already saved items (avoid duplicate labels):
${vaultContext}

Your job: extract a label and the exact content from what the user says.
Respond ONLY with raw JSON — no markdown, no backticks, nothing else.

SAVE — when the user provides something to store
(trigger phrases: ${g.savePhrases}):
{
  "intent": "save",
  "label":   "<${g.labelHint}>",
  "content": "<${g.contentHint}>",
  "reply":   "<fun confirmation with 1-2 emojis, e.g. Done! 🔐 Your Netflix Password is locked up safe and sound.>"
}

OTHER — when the message is unclear, missing content, or just a greeting:
{
  "intent": "other",
  "reply":  "<warm friendly ask for what they want to save, with 1 emoji>"
}

IMPORTANT RULES:
1. Never invent content. Only use exactly what the user provided.
2. For code/commands: preserve every character, space, and line break exactly.
3. Label must be 2-5 words, title case, descriptive, NO emojis in label.
4. If a label already exists in saved items, ask if they want to update it instead.
5. If the user seems to want to retrieve something (says "give me", "what's my"),
   gently remind them they are in Save mode and can switch to My Vault to retrieve.
6. Emojis and humor go in "reply" ONLY — never in "label" or "content".
        `.trim();
    }

    private buildRetrievePrompt(type: VaultItemType, vaultContext: string): string {
        const g = TYPE_GUIDANCE[type];

        return `
${PERSONALITY_PREFIX}

---

You are VaultMind, a secure AI vault assistant.
The user is in MY VAULT mode viewing their ${g.description}s.

Currently saved items:
${vaultContext}

Detect what the user wants and respond ONLY with raw JSON — no markdown, no backticks.

RETRIEVE — user wants to see or get an item
(trigger phrases: ${g.retrievePhrases}, "show me", "list", "what do I have"):
{ "intent": "retrieve", "reply": "<answer using ONLY the saved items above, with 1-2 emojis>" }

UPDATE — user wants to change an existing item's value
(trigger phrases: update, change, replace, new value is, I changed it to):
{ "intent": "update", "label": "<exact label from saved items, NO emojis>", "newContent": "<${g.contentHint}, NO emojis>", "reply": "<fun confirmation with 1-2 emojis>" }

DELETE — user wants to remove an item
(trigger phrases: delete, remove, get rid of, I don't need):
{ "intent": "delete", "label": "<exact label from saved items, NO emojis>", "reply": "<fun confirmation with 1-2 emojis>" }

OTHER — greeting, unrelated, or unclear:
{ "intent": "other", "reply": "<warm friendly response with 1 emoji>" }

IMPORTANT RULES:
1. For RETRIEVE: never invent values. Only answer from the saved items above.
   If not found say something like: "Hmm, couldn't find that one! 🤔 Did you mean one of: [list labels]?"
2. For UPDATE: newContent must come from what the user typed — never make it up.
   For code/commands: preserve every character exactly. No emojis in newContent.
3. For DELETE: always confirm what was deleted by its exact label name.
4. Label matching for update/delete is case-insensitive.
5. If the user asks "show all" or "list everything", show all saved items.
6. If saved items list is empty, say so with personality and suggest switching to New Vault.
7. Emojis and humor go in "reply" ONLY — never in "label", "content", or "newContent".
        `.trim();
    }

    // ── Intent execution ──────────────────────────────────────────────────────

    private async executeIntent(
        parsed:     AiIntent,
        userId:     string,
        category:   VaultCategory,
        type:       VaultItemType,
        vaultItems: IdentifierVaultItem[]
    ): Promise<string> {

        switch (parsed.intent) {

            case "save": {
                const newItem = IdentifierVaultItem.create({
                    userId,
                    label:    parsed.label,
                    category,
                    type,
                    content:  parsed.content,
                    tags:     [],
                });
                await this.vaultService.createVaultItem(newItem);
                logger.info(`VaultAiService: saved "${parsed.label}" for user ${userId}`);
                return parsed.reply;
            }

            case "update": {
                const existing = vaultItems.find(
                    (i) => i.getLabel().toLowerCase() === parsed.label.toLowerCase()
                );

                if (!existing) {
                    logger.warn(`VaultAiService: update — "${parsed.label}" not found`);
                    return parsed.reply;
                }

                const updatedItem = IdentifierVaultItem.create({
                    id:      existing.getid(),
                    userId,
                    label:   existing.getLabel(),
                    category,
                    type,
                    content: parsed.newContent,
                    tags:    existing.getTags(),
                });

                await this.vaultService.updateVaultItem(updatedItem);
                logger.info(`VaultAiService: updated "${parsed.label}" for user ${userId}`);
                return parsed.reply;
            }

            case "delete": {
                const toDelete = vaultItems.find(
                    (i) => i.getLabel().toLowerCase() === parsed.label.toLowerCase()
                );

                if (!toDelete) {
                    logger.warn(`VaultAiService: delete — "${parsed.label}" not found`);
                    return parsed.reply;
                }

                await this.vaultService.deleteVaultItem(toDelete.getid());
                await this.chatService.clearHistory(userId, category, type);
                logger.info(`VaultAiService: deleted "${parsed.label}" for user ${userId}`);
                return parsed.reply;
            }

            default:
                // retrieve or other — AI reply goes directly to user
                return parsed.reply;
        }
    }
}