import { webcrypto } from "node:crypto";
const crypto = webcrypto as unknown as Crypto;

// Get encryption key from environment
const ENCRYPTION_KEY_B64 = process.env.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY_B64) {
	throw new Error("ENCRYPTION_KEY environment variable is required");
}

// Convert base64 key to CryptoKey once
const cryptoKeyPromise = (async () => {
	const keyData = Uint8Array.from(atob(ENCRYPTION_KEY_B64), (c) =>
		c.charCodeAt(0)
	);
	return crypto.subtle.importKey(
		"raw",
		keyData,
		{ name: "AES-GCM", length: 256 },
		false,
		["encrypt", "decrypt"]
	);
})();

export async function encryptKey(privateKey: string): Promise<string> {
	const key = await cryptoKeyPromise;
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const encrypted = await crypto.subtle.encrypt(
		{ name: "AES-GCM", iv },
		key,
		new TextEncoder().encode(privateKey)
	);

	const combined = new Uint8Array([...iv, ...new Uint8Array(encrypted)]);
	return Buffer.from(combined).toString("base64");
}

export async function decryptKey(encryptedKey: string): Promise<string> {
	const key = await cryptoKeyPromise;
	const combined = Buffer.from(encryptedKey, "base64");

	const iv = combined.slice(0, 12);
	const encrypted = combined.slice(12);

	const decrypted = await crypto.subtle.decrypt(
		{ name: "AES-GCM", iv },
		key,
		encrypted
	);

	return new TextDecoder().decode(decrypted);
}
