import express, { Express, Request, Response } from "express";
import { AgentFramework } from "./framework";
import { standardMiddleware } from "./middleware";
import { Character, InputObject, InputSource, InputType, Route } from "./types";
import { BaseAgent } from "./agent";
import { LLMUtils } from "./utils/llm";
import { prisma } from "./utils/db";
import readline from "readline";
import fetch from "node-fetch";
import { stern as sternCharacter } from "./agent/character";
import { routes } from "./routes";
// Initialize Express and LLM utils
const app: Express = express();
app.use(express.json());
const llmUtils = new LLMUtils();

// Initialize framework with middleware
const framework = new AgentFramework();
standardMiddleware.forEach((middleware) => framework.use(middleware));

// Initialize agent
const stern = new BaseAgent(sternCharacter);
const agents = [stern];

// Add routes
routes.forEach((route: Route) => stern.addRoute(route));

// Add API endpoint
app.post("/agent/input", (req: Request, res: Response) => {
	try {
		const agentId = req.body.input.agentId;
		const agent = agents.find((agent) => agent.getAgentId() === agentId);

		if (!agent) {
			return res.status(404).json({ error: "Agent not found" });
		}

		const bodyInput = req.body.input;
		const input: InputObject = {
			source: InputSource.NETWORK,
			userId: bodyInput.userId,
			agentId: stern.getAgentId(),
			roomId: `${agentId}_${bodyInput.userId}`,
			type: InputType.TEXT,
			text: bodyInput.text,
		};

		framework.process(input, stern, res);
	} catch (error) {
		console.error("Server error:", error);
		return res.status(500).json({ error: "Internal server error" });
	}
});

// CLI Interface
async function startCLI() {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	console.log("\nStern AI Mentor");
	console.log("==============");
	console.log("Type 'exit' to quit");

	async function prompt() {
		rl.question("\nYou: ", async (text) => {
			try {
				const response = await fetch("http://localhost:3000/agent/input", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						input: {
							agentId: "stern",
							userId: "cli_user",
							text: text,
						},
					}),
				});

				const data = await response.json();
				console.log("\nStern:", data);
				prompt();
			} catch (error) {
				console.error("\nError:", error);
				prompt();
			}
		});
	}

	prompt();
}

const PORT = process.env.PORT || 3000;
let server: any;

async function start() {
	server = app.listen(PORT, () => {
		console.log(`Server running on http://localhost:${PORT}`);
		startCLI();
	});
}

if (require.main === module) {
	start().catch(console.error);
}

export { stern, startCLI };
