// External dependencies
import { z } from "zod";

// Internal imports
import { AgentMiddleware, Route, LLMSize } from "../types";
import { LLMUtils } from "../utils/llm";

/**
 * Schema for validating route selection responses from the LLM
 */
const routeSchema = z.object({
	selectedRoute: z.string(),
	confidence: z.number().min(0).max(1),
	reasoning: z.string(),
});

/**
 * Middleware that routes incoming requests to the appropriate handler
 * based on the content of the request and available routes
 */
export const router: AgentMiddleware = async (req, res, next) => {
	try {
		const llmUtils = new LLMUtils();
		const routes = req.agent.getRoutes();

		// Format route descriptions for the LLM prompt
		const routeDescriptions = routes
			.map((route: Route) => `"${route.name}": ${route.description}`)
			.join("\n");

		// Construct the prompt for route selection
		const prompt = `
<CONTEXT>
${req.context}
</CONTEXT>

<SYSTEM>
You are functioning as a request router for an AI agent with the following system prompt:

${req.agent.getSystemPrompt()}

Your task is to analyze incoming messages and route them to the most appropriate handler based on the available routes below. Consider the agent's purpose and capabilities when making this decision.

Available Routes:
${routeDescriptions}

Based on the agent's system description and the available routes, select the most appropriate route to handle this interaction.

Respond with a JSON object containing:
- selectedRoute: The name of the selected route
- confidence: A number between 0 and 1 indicating confidence in the selection
- reasoning: A brief explanation of why this route was selected
</SYSTEM>
`.trim();

		// For debugging: uncomment to see the last part of the prompt
		// console.log("Router prompt (last 2000 chars):", prompt.slice(-2000));

		const routeDecision = await llmUtils.getObjectFromLLM(
			prompt,
			routeSchema,
			LLMSize.LARGE
		);

		// Find the handler for the selected route
		const handler = routes.find((r) => r.name === routeDecision.selectedRoute);
		if (!handler) {
			return res.error(
				new Error(`No handler found for route: ${routeDecision.selectedRoute}`)
			);
		}
		
		console.log(`ROUTE DECISION: ${routeDecision.selectedRoute}`);

		// Log a warning if the confidence is low
		if (routeDecision.confidence < 0.7) {
			console.warn(
				`Low confidence routing decision (${routeDecision.confidence.toFixed(2)}) for route: ${routeDecision.selectedRoute}`
			);
			console.warn(`Reasoning: ${routeDecision.reasoning}`);
		}

		// Execute the selected route handler
		try {
			await handler.handler(req.context || "", req, res);
			await next();
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			await res.error(
				new Error(
					`Route handler error (${routeDecision.selectedRoute}): ${errorMessage}`
				)
			);
		}
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		await res.error(new Error(`Router error: ${errorMessage}`));
	}
};
