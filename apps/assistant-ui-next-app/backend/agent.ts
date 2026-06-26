import { ChatAnthropic } from "@langchain/anthropic";
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";

import { webSearchTool } from "./tools/web-search";

const checkpointer = PostgresSaver.fromConnString(process.env.DATABASE_URL!);
checkpointer.setup().catch(console.error);

const tools = [webSearchTool];
const model = new ChatAnthropic({
  model: process.env.ANTHROPIC_MODEL,
  apiKey: process.env.ANTHROPIC_API_KEY,
  streaming: true,
  clientOptions: { baseURL: process.env.ANTHROPIC_BASE_URL },
}).bindTools(tools);

const systemPrompt = `You are a helpful assistant. Use the web_search tool when answering questions that need current, external, or source-backed information. When you use web_search, cite the source URLs from the tool results in your final answer.`;

const callModel = async (state: typeof MessagesAnnotation.State) => {
  const response = await model.invoke([
    { role: "system", content: systemPrompt },
    ...state.messages,
  ]);
  return { messages: [response] };
};

export const graph = new StateGraph(MessagesAnnotation)
  .addNode("agent", callModel)
  .addNode("tools", new ToolNode(tools))
  .addEdge("__start__", "agent")
  .addConditionalEdges("agent", toolsCondition, ["tools", "__end__"])
  .addEdge("tools", "agent")
  .compile({ checkpointer });
