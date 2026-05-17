import { IAiProvider } from "./Iaiprovider";

/**
 * Google Gemini implementation of IAiProvider.
 * Uses Gemini 2.5 Flash — available on the free tier, no credit card needed.
 *
 * Install: npm install @google/generative-ai
 */
export class GeminiProvider implements IAiProvider {
    private readonly apiKey: string;
    private readonly model = "gemini-2.5-flash"; // free tier model

    constructor(apiKey: string) {
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY is required. Get one free at https://aistudio.google.com");
        }
        this.apiKey = apiKey;
    }

    async chat(
        systemPrompt: string,
        history: { role: "user" | "assistant"; content: string }[],
        userMessage: string
    ): Promise<string> {
        const { GoogleGenerativeAI } = await import("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(this.apiKey);

        const geminiModel = genAI.getGenerativeModel({
            model: this.model,
            systemInstruction: systemPrompt,
        });

        // Gemini uses "model" instead of "assistant" for its role label
        const geminiHistory = history.map((msg) => ({
            role:  msg.role === "assistant" ? "model" : "user",
            parts: [{ text: msg.content }],
        }));

        const chat = geminiModel.startChat({ history: geminiHistory });
        const result = await chat.sendMessage(userMessage);

        return result.response.text();
    }
}