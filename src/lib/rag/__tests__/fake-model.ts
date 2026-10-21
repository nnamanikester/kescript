import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { AIMessage, type BaseMessage } from "@langchain/core/messages";
import type { ChatResult } from "@langchain/core/outputs";

/** A LangChain chat model that replies with fixed text (or each of a list in turn) and records what it was sent. */
export class RecordingChatModel extends BaseChatModel {
  calls: BaseMessage[][] = [];
  private readonly replies: string[];
  constructor(reply: string | string[]) {
    super({});
    this.replies = Array.isArray(reply) ? reply : [reply];
  }
  _llmType() {
    return "recording";
  }
  async _generate(messages: BaseMessage[]): Promise<ChatResult> {
    this.calls.push(messages);
    const reply = this.replies[Math.min(this.calls.length, this.replies.length) - 1];
    return { generations: [{ text: reply, message: new AIMessage(reply) }] };
  }
  /** [system, user] text of the n-th call. */
  sent(n = 0) {
    const m = this.calls[n];
    return { system: m.find((x) => x.type === "system")?.text ?? "", user: m.at(-1)?.text ?? "" };
  }
}
