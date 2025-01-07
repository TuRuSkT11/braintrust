import { handleConversation } from "./conversation";
import {
	handleContractCreate,
	handleContractFormationHelp,
	handleContractVerification,
	handleContractCancel,
} from "./contract";

export const routes = {
	conversation: {
		name: "conversation",
		description:
			"Call if the user is just conversing or if none of the other routes apply",
		handler: handleConversation,
	},
	contract_create: {
		name: "contract_create",
		description:
			"Call if the user wants to create an accountability contract AND has provided a goal, deadline, and solana return address.",
		handler: handleContractCreate,
	},
	contract_formation_help: {
		name: "contract_formation_help",
		description:
			"Call if the user seems to want to form an accountability contract, but has not provided all of the following: a goal, deadline, and solana return address.",
		handler: handleContractFormationHelp,
	},
	contract_verification: {
		name: "contract_verification",
		description:
			"Call if the user wants to verify they have fulfilled a contract.",
		handler: handleContractVerification,
	},
	contract_cancel: {
		name: "contract_cancel",
		description:
			"Call if the user made a contract in the last couple of hours and wants to cancel it.",
		handler: handleContractCancel,
	},
};
