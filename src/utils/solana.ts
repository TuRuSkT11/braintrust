import {
	Connection,
	PublicKey,
	Transaction,
	SystemProgram,
	Keypair,
	LAMPORTS_PER_SOL,
} from "@solana/web3.js";

// Basic keypair generation interface
interface KeyPair {
	publicKey: string;
	privateKey: string;
}

export async function generateKeypair(): Promise<KeyPair> {
	const keypair = Keypair.generate();
	return {
		publicKey: keypair.publicKey.toString(),
		privateKey: Buffer.from(keypair.secretKey).toString("base64"),
	};
}

export async function validateSolanaAddress(address: string): Promise<boolean> {
	try {
		new PublicKey(address);
		return true;
	} catch (error) {
		return false;
	}
}

export async function transferFunds(
	privateKey: string,
	returnAddress: string
): Promise<string | null> {
	try {
		const connection = new Connection(
			process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
			"confirmed"
		);

		const keypair = Keypair.fromSecretKey(Buffer.from(privateKey, "base64"));

		const publicKey = new PublicKey(keypair.publicKey);
		const balance = await connection.getBalance(publicKey);

		if (balance === 0) {
			console.log(
				"No funds to return from address:",
				keypair.publicKey.toString()
			);
			return "No funds to return from address:" + keypair.publicKey.toString();
		}

		const transaction = new Transaction().add(
			SystemProgram.transfer({
				fromPubkey: keypair.publicKey,
				toPubkey: new PublicKey(returnAddress),
				lamports: balance,
			})
		);

		const latestBlockhash = await connection.getLatestBlockhash();
		transaction.recentBlockhash = latestBlockhash.blockhash;
		transaction.feePayer = keypair.publicKey;

		const message = transaction.compileMessage();
		const fee = await connection.getFeeForMessage(message);

		if (!fee?.value) {
			throw new Error("Failed to calculate transaction fee");
		}

		const RENT_BUFFER = 1000000;

		const amountToSend = balance - fee.value - RENT_BUFFER;

		if (amountToSend <= 0) {
			console.log("Balance too low to cover transaction fee");
			return "No funds to return from address:" + keypair.publicKey.toString();
		}

		transaction.instructions[0] = SystemProgram.transfer({
			fromPubkey: keypair.publicKey,
			toPubkey: new PublicKey(returnAddress),
			lamports: amountToSend,
		});

		const signature = await connection.sendTransaction(transaction, [keypair], {
			preflightCommitment: "confirmed",
		});

		await connection.confirmTransaction(signature);

		console.log(
			`Returned ${amountToSend / LAMPORTS_PER_SOL} SOL to ${returnAddress}`,
			`Transaction: ${signature}`
		);

		return signature;
	} catch (error) {
		console.error("Error returning funds:", error);
		throw error;
	}
}
