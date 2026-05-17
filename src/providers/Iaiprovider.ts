/**
 * Every AI provider (Gemini, Claude, OpenAI…) implements this interface.
 * The VaultAiService only depends on this contract — never on a specific SDK.
 * Swapping providers = changing one line in the route file.
 */
export interface IAiProvider {
    /**
     * Sends a conversation to the AI and returns its reply as plain text.
     *
     * @param systemPrompt  Instructions that define the AI's persona and rules.
     * @param history       Previous turns: [{ role: "user"|"assistant", content }]
     * @param userMessage   The latest message from the user.
     */
    chat(
        systemPrompt: string,
        history: { role: "user" | "assistant"; content: string }[],
        userMessage: string
    ): Promise<string>;
}