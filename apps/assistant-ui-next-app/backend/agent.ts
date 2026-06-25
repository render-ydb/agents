import { ChatAnthropic } from "@langchain/anthropic";
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";

const model = new ChatAnthropic({
  model: process.env.ANTHROPIC_MODEL,
  apiKey: process.env.ANTHROPIC_API_KEY,
  streaming: true,
  clientOptions: { baseURL: process.env.ANTHROPIC_BASE_URL },
  
});

const callModel = async (state: typeof MessagesAnnotation.State) => {
  const response = await model.invoke(state.messages);
 
  return { messages: [response] };
};

export const graph = new StateGraph(MessagesAnnotation)
  .addNode("agent", callModel)
  .addEdge("__start__", "agent")
  .addEdge("agent", "__end__")
  .compile();
