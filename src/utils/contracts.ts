import { Contract } from "../types";
import { prisma } from "./db";

export class ContractUtils {
	static async createContract(
		userId: string,
		goal: string,
		deadline: Date,
		returnAddress: string
	): Promise<Contract> {
		return await prisma.contract.create({
			data: {
				userId,
				goal,
				deadline,
				returnAddress,
				status: "active",
			},
		});
	}

	static async getActiveContracts(userId: string): Promise<Contract[]> {
		return await prisma.contract.findMany({
			where: {
				userId,
				status: "active",
			},
		});
	}

	static async getUserContract(
		contractId: string,
		userId: string
	): Promise<Contract | null> {
		return await prisma.contract.findUnique({
			where: { id: contractId, userId },
		});
	}

	static async updateContractStatus(
		contractId: string,
		status: "completed" | "cancelled" | "failed"
	): Promise<Contract> {
		return await prisma.contract.update({
			where: { id: contractId },
			data: {
				status,
				completedAt: status === "completed" ? new Date() : undefined,
			},
		});
	}

	static validateSolanaAddress(address: string): boolean {
		return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
	}

	static validateDeadline(deadline: Date): boolean {
		return deadline > new Date();
	}
}
