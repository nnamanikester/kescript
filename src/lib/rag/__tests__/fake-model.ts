import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { AIMessage, type BaseMessage } from "@langchain/core/messages";
import type { ChatResult } from "@langchain/core/outputs";

/** A LangChain chat model that replies with fixed text and records what it was sent. */
export class RecordingChatModel extends BaseChatModel {
  calls: BaseMessage[][] = [];
  constructor(private readonly reply: string) {
    super({});
  }
  _llmType() {
    return "recording";
  }
  async _generate(messages: BaseMessage[]): Promise<ChatResult> {
    this.calls.push(messages);
    return { generations: [{ text: this.reply, message: new AIMessage(this.reply) }] };
  }
  /** [system, user] text of the n-th call. */
  sent(n = 0) {
    const m = this.calls[n];
    return { system: m.find((x) => x.type === "system")?.text ?? "", user: m.at(-1)?.text ?? "" };
  }
}
