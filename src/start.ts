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

// @ts-ignore
import { TwitterClient } from "../clients/twitter";

const app: Express = express();
app.use(express.json());
const llmUtils = new LLMUtils();

const framework = new AgentFramework();
standardMiddleware.forEach((middleware) => framework.use(middleware));

const stern = new BaseAgent(sternCharacter);
const agents = [stern];

routes.forEach((route: Route) => stern.addRoute(route));

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
			type:
				bodyInput.type === "text" ? InputType.TEXT : InputType.TEXT_AND_IMAGE,
			text: bodyInput.text,
			imageUrls: bodyInput.imageUrls,
		};

		framework.process(input, stern, res);
	} catch (error) {
		console.error("Server error:", error);
		return res.status(500).json({ error: "Internal server error" });
	}
});

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

async function startTwitterClient() {
	const username = process.env.TWITTER_USERNAME || "";
	const password = process.env.TWITTER_PASSWORD || "";
	const email = process.env.TWITTER_EMAIL || "";
	const twoFactorSecret = process.env.TWITTER_2FA_SECRET || "";
	const postIntervalHours = process.env.TWITTER_POST_INTERVAL_HOURS
		? parseInt(process.env.TWITTER_POST_INTERVAL_HOURS, 10)
		: 4;
	const pollingInterval = process.env.TWITTER_POLLING_INTERVAL
		? parseInt(process.env.TWITTER_POLLING_INTERVAL, 10)
		: 5;
	const dryRun = process.env.TWITTER_DRY_RUN === "true";

	const config = {
		username,
		password,
		email,
		twoFactorSecret: twoFactorSecret || undefined,
		retryLimit: 3,
		postIntervalHours,
		enableActions: false,
		pollingInterval,
		dryRun,
	};

	const twitterClient = new TwitterClient(stern, config);
	await twitterClient.start();
}

const PORT = process.env.PORT || 3000;
let server: any;

async function start() {
	server = app.listen(PORT, () => {
		console.log(`Server running on http://localhost:${PORT}`);
		startCLI();

		startTwitterClient().catch((err) => {
			console.error("Error starting Twitter client:", err);
		});
	});
}

if (require.main === module) {
	start().catch(console.error);
}

export { stern, startCLI };
