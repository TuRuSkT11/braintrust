import { prisma } from "./db";

export interface TweetData {
	id: string;
	text: string;
	userId: string;
	username: string;
	conversationId?: string;
	inReplyToId?: string;
	permanentUrl?: string;
}

export async function createTwitterMemory(
	userId: string,
	agentId: string,
	roomId: string,
	message: string,
	generator: string = "llm"
) {
	await prisma.memory.create({
		data: {
			userId,
			agentId,
			roomId,
			type: "tweet",
			generator: generator,
			content: JSON.stringify({ text: message }),
		},
	});
}

export async function doesTweetExist(tweetId: string): Promise<boolean> {
	const count = await prisma.tweet.count({
		where: { id: tweetId },
	});
	return count > 0;
}

export async function storeTweetIfNotExists(
	tweet: TweetData
): Promise<boolean> {
	const exists = await doesTweetExist(tweet.id);

	if (!exists) {
		await prisma.tweet.create({
			data: {
				id: tweet.id,
				text: tweet.text,
				userId: tweet.userId,
				username: tweet.username,
				conversationId: tweet.conversationId,
				inReplyToId: tweet.inReplyToId,
				permanentUrl: tweet.permanentUrl,
			},
		});
		return true; // Indicates we stored a new tweet
	}

	return false; // Indicates tweet already existed
}

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
