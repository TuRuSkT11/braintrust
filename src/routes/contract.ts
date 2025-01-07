import { z } from "zod";
import { LLMUtils } from "../utils/llm";
import { ContractUtils } from "../utils/contracts";
import { AgentRequest, AgentResponse, LLMSize } from "../types";
import { handleConversation } from "./conversation";
const llmUtils = new LLMUtils();

export const handleContractCreate = async (
	context: string,
	req: AgentRequest,
	res: AgentResponse
) => {
	const contractCreateSchema = z.object({
		goal: z.string().optional(),
		deadline: z.string().optional(),
		returnAddress: z.string().optional(),
		abort: z.boolean().optional(),
	});

	const analysis = await llmUtils.getObjectFromLLM(
		`${context}\n\n
		<SYSTEM> The user is trying to create an accountability contract. They have provided a goal, deadline, and solana return address. Extract them. If they do not seem to want to create a contract, return true for the abort field. </SYSTEM>`,
		contractCreateSchema,
		LLMSize.SMALL
	);

	if (analysis.abort) {
		return handleConversation(context, req, res);
	}

	const missingFields = [];
	if (!analysis.goal) missingFields.push("a specific goal");
	if (!analysis.deadline) missingFields.push("a deadline");
	if (!analysis.returnAddress) missingFields.push("a Solana return address");

	if (missingFields.length > 0) {
		await res.send(
			`To create a contract, I'll need: ${missingFields.join(
				", "
			)}. Please provide these details.`
		);
		return;
	}

	if (!ContractUtils.validateSolanaAddress(analysis.returnAddress!)) {
		await res.send(
			"The provided Solana address appears to be invalid. Please check and provide a valid address."
		);
		return;
	}

	const deadlineDate = new Date(analysis.deadline!);
	if (!ContractUtils.validateDeadline(deadlineDate)) {
		return await res.send("The deadline must be in the future.");
	}
	// TODO: form key pair, encrypt the private key and send the public key to the user so they can make the deposit
	// TODO: update prisma schema to include the public key, private key
	// TODO: utils file for solana (transfer, encrypto and decrypt key)

	await ContractUtils.createContract(
		req.input.userId,
		analysis.goal!,
		deadlineDate,
		analysis.returnAddress!
	);

	// TODO: send the public key to the user so they can make the deposit along with other contract details
	// TODO: save the message we send to the user as a memory
	await res.send(
		"Contract created successfully! I'll help you stay accountable to your goal."
	);
};

export const handleContractFormationHelp = async (
	context: string,
	req: AgentRequest,
	res: AgentResponse
) => {
	const response = await llmUtils.getTextFromLLM(
		`${context}\n\n 
		<SYSTEM> The user is trying to create an accountability contract, but has not provided all of the following: a goal, deadline, and solana return address. Guide them along and ask for the missing information. If it is not clear they want to create a contract, ask them for clarification. </SYSTEM>`,
		"anthropic/claude-3.5-sonnet"
	);

	// TODO: save the message we send to the user as a memory

	await res.send(response);
};

export const handleContractVerification = async (
	context: string,
	req: AgentRequest,
	res: AgentResponse
) => {
	const llmUtils = new LLMUtils();

	const schema = z.object({
		contractId: z.string().optional(),
		message: z.string().optional(),
		abort: z.boolean().optional(),
	});

	const analysis = await llmUtils.getObjectFromLLM(
		`${context}\n\n
		<SYSTEM> The user claims to have completed their contract. See if they provided proof of the completion. If they did then then return the contractId of the contract they completed. Give them the benefit of doubt and believe them unless they provide no proof at all. If the proof is insufficient, dont return a contractId and include a message asking them to provide more proof. If the user is not trying to complete a contract, return true for the abort field. </SYSTEM>`,
		schema,
		LLMSize.LARGE
	);

	if (analysis.abort) {
		return handleConversation(context, req, res);
	}

	const contract = await ContractUtils.getUserContract(
		analysis.contractId!,
		req.input.userId
	);

	if (!contract) {
		return await res.send(
			"I couldn't find that specific contract. Please try again."
		);
	}

	// TODO: send the solana back to the return address and get the tx signature
	// TODO: save the message we send to the user as a memory
	await ContractUtils.updateContractStatus(contract.id, "completed");

	await res.send(
		`Contract completed successfully. I have returned any funds sent to the deposit address. \n\n${"txSignature"}`
	);
};

export const handleContractCancel = async (
	context: string,
	req: AgentRequest,
	res: AgentResponse
) => {
	const llmUtils = new LLMUtils();

	const contractCancelSchema = z.object({
		contractId: z.string().optional(),
		abort: z.boolean().optional(),
	});

	const analysis = await llmUtils.getObjectFromLLM(
		`${context}\n\n
		<SYSTEM> The user may be trying to cancel a contract. If so return the contractId of the contract they want to cancel. If they are not trying to cancel a contract, return true for the abort field. </SYSTEM>`,
		contractCancelSchema,
		LLMSize.SMALL
	);

	if (analysis.abort) {
		return handleConversation(context, req, res);
	}

	const contract = await ContractUtils.getUserContract(
		analysis.contractId!,
		req.input.userId
	);

	if (!contract) {
		return await res.send(
			"I couldn't find that specific contract. Please check the contract ID and try again."
		);
	}

	if (contract.createdAt < new Date(Date.now() - 2 * 60 * 60 * 1000)) {
		return await res.send(
			"You can only cancel a contract within 2 hours of creating it."
		);
	}

	await ContractUtils.updateContractStatus(contract.id, "cancelled");

	// TODO: send the solana back to the return address and get the tx signature (same as verification)
	// TODO: save the message we send to the user as a memory

	await res.send(
		`Contract cancelled successfully. I have returned any funds sent to the deposit address. \n\n${"txSignature"}`
	);
};
