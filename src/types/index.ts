export enum InputType {
	TEXT = "text",
	IMAGE = "image",
	TEXT_AND_IMAGE = "text_and_image",
	AUDIO = "audio",
	VIDEO = "video",
}

export enum InputSource {
	NETWORK = "network",
	CLI = "cli",
	API = "api",
}

export enum LLMSize {
	SMALL = "small", // gpt-4o-mini
	LARGE = "large", // gpt-4o
}

export interface InputObject {
	source: InputSource;
	userId: string;
	agentId: string;
	roomId: string;
	type: InputType;
	text?: string;
	imageUrl?: string;
	audioUrl?: string;
	videoUrl?: string;
	[key: string]: any;
}

export interface Character {
	name: string;
	agentId: string;
	system: string;
	bio: string[];
	lore: string[];
	messageExamples: Array<
		Array<{
			user: string;
			content: {
				text: string;
			};
		}>
	>;
	postExamples: string[];
	topics: string[];
	style: {
		all: string[];
		chat: string[];
		post: string[];
	};
	adjectives: string[];
	routes: Route[];
}

export interface Contract {
	id: string;
	userId: string;
	goal: string;
	deadline: Date;
	returnAddress: string;
	amount: number | null | undefined;
	status: string;
	createdAt: Date;
	updatedAt: Date;
	completedAt: Date | null | undefined;
}

export interface Route {
	name: string;
	description: string;
	handler: (
		context: string,
		req: AgentRequest,
		res: AgentResponse
	) => Promise<void>;
}

export interface AgentRequest {
	input: InputObject;
	agent: Agent;
	context?: string;
	memories?: Memory[];
	contract?: Contract;
	[key: string]: any;
}

export interface AgentResponse {
	send: (content: any) => Promise<void>;
	error: (error: any) => Promise<void>;
	[key: string]: any;
}

export interface Memory {
	id: string;
	userId: string;
	agentId: string;
	roomId: string;
	content: any;
	type: string;
	createdAt: Date;
}

export type AgentMiddleware = (
	req: AgentRequest,
	res: AgentResponse,
	next: () => Promise<void>
) => Promise<void>;

export interface Agent {
	getAgentContext(): string;
	getRoutes(): Map<string, Route>;
	getSystemPrompt(): string;
	addRoute(route: Route): void;
	getAgentId(): string;
}
