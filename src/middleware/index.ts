import { validateInput } from "./validate-input";
import { loadMemories } from "./load-memories";
import { wrapContext } from "./wrap-context";
import { router } from "./router";
import { createMemoryFromInput } from "./create-memory";
import { AgentMiddleware } from "../types";

// Export individual middleware
export {
	validateInput,
	loadMemories,
	wrapContext,
	router,
	createMemoryFromInput,
};

// Export standard middleware stack
export const standardMiddleware: AgentMiddleware[] = [
	validateInput,
	loadMemories, // Then load previous memories
	wrapContext, // Wrap everything in context
	createMemoryFromInput,
	router, // Finally, route to appropriate handler
];
