import { prisma } from "./db";

export async function createContractMemory(
	userId: string,
	agentId: string,
	roomId: string,
	message: string
) {
	await prisma.memory.create({
		data: {
			userId,
			agentId,
			roomId,
			type: "contract",
			generator: "llm",
			content: JSON.stringify({ text: message }),
		},
	});
}
