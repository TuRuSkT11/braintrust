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
		// Initialize Solana connection
		const connection = new Connection(
			process.env.RPC_URL || "https://api.mainnet-beta.solana.com",
			"confirmed"
		);

		// Create keypair from private key
		const keypair = Keypair.fromSecretKey(Buffer.from(privateKey, "base64"));

		// Get the current balance
		const publicKey = new PublicKey(keypair.publicKey);
		const balance = await connection.getBalance(publicKey);

		// If no balance, nothing to return
		if (balance === 0) {
			console.log("No funds to return from address:", keypair.publicKey);
			return null;
		}

		// Calculate the fee using getFeeForMessage
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

		if (fee.value === undefined) {
			throw new Error("Failed to calculate transaction fee");
		}

		// Add a buffer for rent-exemption (0.001 SOL = 1000000 lamports)
		const RENT_BUFFER = 1000000;

		// Recalculate amount to send (balance - fee - rent buffer)
		const amountToSend = balance - fee.value - RENT_BUFFER;

		// Make sure we have enough to cover the fee and send something
		if (amountToSend <= 0) {
			console.log("Balance too low to cover transaction fee");
			return "No balance to return";
		}

		// Update transaction with correct amount
		transaction.instructions[0] = SystemProgram.transfer({
			fromPubkey: keypair.publicKey,
			toPubkey: new PublicKey(returnAddress),
			lamports: amountToSend,
		});

		// Send transaction
		const signature = await connection.sendTransaction(transaction, [keypair], {
			preflightCommitment: "confirmed",
		});

		// Wait for confirmation
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
