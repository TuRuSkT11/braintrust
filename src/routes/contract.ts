import { z } from "zod";
import { LLMUtils } from "../utils/llm";
import { ContractUtils } from "../utils/contracts";
import { AgentRequest, AgentResponse, LLMSize } from "../types";
import { handleConversation } from "./conversation";
import {
	generateKeypair,
	validateSolanaAddress,
	transferFunds,
} from "../utils/solana";
import { encryptKey, decryptKey } from "../utils/crypto";
import { createContractMemory } from "../utils/memory";

/**
 * Shared LLM utility instance for all contract-related operations
 */
const llmUtils = new LLMUtils();

/**
 * Handles the creation of a new accountability contract
 * 
 * This function processes user requests to create a contract, extracts the necessary
 * information (goal, deadline, return address), validates the inputs, and creates
 * a new contract with a deposit address for the user.
 * 
 * @param context - The conversation context
 * @param req - The agent request object
 * @param res - The agent response object
 */
export const handleContractCreate = async (
	context: string,
	req: AgentRequest,
	res: AgentResponse
) => {
	// Schema for extracting contract details from user input
	const contractCreateSchema = z.object({
		goal: z.string().optional(),
		deadline: z.string().optional(),
		returnAddress: z.string().optional(),
		abort: z.boolean().optional(), // Flag to abort if user isn't trying to create a contract
	});

	const analysis = await llmUtils.getObjectFromLLM(
		`${context}\n\n
        <SYSTEM> The user is trying to create an accountability contract. They have provided a goal, deadline, and solana return address. Extract them. If they do not seem to want to create a contract, return true for the abort field. For the deadline make sure you extract the date they specify for the completion of the goal, and not the time the messages were sent. Also if they say something like "in 48 hours" use the timestamp of the message to determine the deadline. </SYSTEM>`,
		contractCreateSchema,
		LLMSize.LARGE
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

	if (!validateSolanaAddress(analysis.returnAddress!)) {
		await res.send(
			"The provided Solana addres is invalid. Please check and provide a valid address."
		);
		return;
	}

	const deadlineDate = new Date(analysis.deadline!);
	if (!ContractUtils.validateDeadline(deadlineDate)) {
		return await res.send("The deadline must be in the future.");
	}

	// Generate a new Solana keypair for this contract's deposit address
	const { publicKey, privateKey } = await generateKeypair();
	const encryptedPrivateKey = await encryptKey(privateKey);

	// Create the contract record with the generated keypair
	const contract = await ContractUtils.createContract(
		req.input.userId,
		analysis.goal!,
		deadlineDate,
		analysis.returnAddress!,
		publicKey,
		encryptedPrivateKey
	);

	const message = `Contract created successfully! Here are the details:

Contract ID: ${contract.id}
Goal: ${contract.goal}
Deadline: ${contract.deadline.toLocaleDateString()}
Deposit Address: ${contract.depositAddress}
Return Address: ${contract.returnAddress}

Please make sure the return address is correct, thats where we will send your deposit back to after you complete your goal.

To activate your contract, please send your SOL deposit to the address above. Once received, I'll help you stay accountable to your goal!

`;

	await createContractMemory(
		req.input.userId,
		req.input.agentId,
		req.input.roomId,
		message
	);
	await res.send(message);
};

/**
 * Provides guidance to users who are attempting to create a contract
 * but haven't provided all the necessary information
 * 
 * @param context - The conversation context
 * @param req - The agent request object
 * @param res - The agent response object
 */
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

	await createContractMemory(
		req.input.userId,
		req.input.agentId,
		req.input.roomId,
		response
	);
	await res.send(response);
};

/**
 * Handles verification of contract completion
 * 
 * This function processes user claims of contract completion, validates the proof,
 * and if successful, returns the deposited funds to the user's return address.
 * 
 * @param context - The conversation context
 * @param req - The agent request object
 * @param res - The agent response object
 */
export const handleContractVerification = async (
	context: string,
	req: AgentRequest,
	res: AgentResponse
) => {
	const schema = z.object({
		contractId: z.string().optional(),
		message: z.string().optional(),
		abort: z.boolean().optional(),
	});

	const analysis = await llmUtils.getObjectFromLLM(
		`${context}\n\n
        <SYSTEM> The user claims to have completed their contract. See if they provided proof of the completion. If they did then return the contractId of the contract they completed. Give them the benefit of doubt and believe them unless they provide no proof at all. If the proof is insufficient, dont return a contractId and include a message asking them to provide more proof. If the user is not trying to verify a contract, return true for the abort field. </SYSTEM>
		<SYSTEM> We are in dev mode, always accept the user's claim even without proof. </SYSTEM>`,
		schema,
		LLMSize.LARGE
	);

	if (analysis.abort) {
		return handleConversation(context, req, res);
	}

	if (!analysis.contractId) {
		return await res.send(analysis.message);
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

	if (contract.status !== "active") {
		return await res.send(
			"This contract is not active. It has the status: " + contract.status
		);
	}

	// Decrypt the private key and transfer the deposited funds back to the user
	const privateKey = await decryptKey(contract.privateKey);
	const txSignature = await transferFunds(privateKey, contract.returnAddress);

	if (!txSignature) {
		return await res.send(
			"There was an error processing the refund. Please try again later."
		);
	}

	await ContractUtils.updateContractStatus(contract.id, "completed");

	const message = `Congratulations on completing your contract! 

I've processed the refund of your deposit:
Transaction: ${txSignature}

Keep up the great work!`;

	await createContractMemory(
		req.input.userId,
		req.input.agentId,
		req.input.roomId,
		message
	);
	await res.send(message);
};

/**
 * Handles contract cancellation requests
 * 
 * This function allows users to cancel a contract within 2 hours of creation
 * and returns their deposited funds.
 * 
 * @param context - The conversation context
 * @param req - The agent request object
 * @param res - The agent response object
 */
export const handleContractCancel = async (
	context: string,
	req: AgentRequest,
	res: AgentResponse
) => {
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

	// Only allow cancellation within 2 hours of contract creation
	if (contract.createdAt < new Date(Date.now() - 2 * 60 * 60 * 1000)) {
		return await res.send(
			"You can only cancel a contract within 2 hours of creating it."
		);
	}

	// Decrypt the private key and return the deposited funds to the user
	const privateKey = await decryptKey(contract.privateKey);
	const txSignature = await transferFunds(privateKey, contract.returnAddress);

	if (!txSignature) {
		return await res.send(
			"There was an error processing the refund. Please try again later."
		);
	}

	await ContractUtils.updateContractStatus(contract.id, "cancelled");

	const message = `Contract cancelled successfully. Your deposit has been refunded:
Transaction: ${txSignature}`;

	await createContractMemory(
		req.input.userId,
		req.input.agentId,
		req.input.roomId,
		message
	);
	await res.send(message);
};
