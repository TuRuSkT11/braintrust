import express, { Express, Request, Response } from "express";
import { AgentFramework } from "./framework";
import { standardMiddleware } from "./middleware";
import { Character, InputObject, InputSource, InputType, Route } from "./types";
import { BaseAgent } from "./agent";
import { LLMUtils } from "./utils/llm";
import { prisma } from "./utils/db";
import readline from "readline";
import fetch from "node-fetch";

// Initialize Express and LLM utils
const app: Express = express();
app.use(express.json());
const llmUtils = new LLMUtils();

// Initialize framework with middleware
const framework = new AgentFramework();
standardMiddleware.forEach((middleware) => framework.use(middleware));

// Define Stern character
const sternCharacter: Character = {
	name: "Stern",
	agentId: "stern",
	system: `You are Stern, an AI mentor focused on providing direct, practical guidance.`,
	bio: [
		"Stern is a direct and efficient mentor with extensive experience in guiding others.",
	],
	lore: [
		"Built expertise through years of practical experience and mentoring.",
	],
	messageExamples: [
		[
			{ user: "student1", content: { text: "How can I improve my skills?" } },
			{
				user: "Stern",
				content: {
					text: "Let's be specific. What skills are you currently working on?",
				},
			},
		],
	],
	postExamples: ["Here's a structured approach to skill development..."],
	topics: ["mentoring", "skill development", "growth"],
	style: {
		all: ["direct", "professional"],
		chat: ["analytical"],
		post: ["structured"],
	},
	adjectives: ["efficient", "practical"],
	routes: [],
};

// Initialize agent
const stern = new BaseAgent(sternCharacter);
const agents = [stern];

// Add conversation route
stern.addRoute({
	name: "conversation",
	description: "Handle conversation",
	handler: async (context: string, req, res) => {
		const response = await llmUtils.getTextFromLLM(
			context,
			"anthropic/claude-3.5-sonnet"
		);

		await prisma.memory.create({
			data: {
				userId: req.input.userId,
				agentId: stern.getAgentId(),
				roomId: req.input.roomId,
				type: "text",
				generator: "llm",
				content: JSON.stringify({ text: response }),
			},
		});

		await res.send(response);
	},
});

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
