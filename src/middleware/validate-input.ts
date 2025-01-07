import { AgentMiddleware } from "../types";

export const validateInput: AgentMiddleware = async (req, res, next) => {
  const { input } = req;

  // Validate required fields
  if (!input.userId || !input.agentId || !input.type) {
    return res.error(new Error("Invalid input: missing required fields"));
  }

  // Validate input type-specific fields
  switch (input.type) {
    case "text":
      if (!input.text) {
        return res.error(new Error("Text input requires text field"));
      }
      break;
  }

  await next();
};