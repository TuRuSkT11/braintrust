import { handleConversation } from "./conversation";
import {
	handleContractCreate,
	handleContractFormationHelp,
	handleContractVerification,
	handleContractCancel,
} from "./contract";

export const routes = [
	{
		name: "conversation",
		description:
			"Call if the user is just conversing or if none of the other routes apply",
		handler: handleConversation,
	},
	{
		name: "contract_create",
		description:
			"Call if the user wants to create an accountability contract AND has provided a goal, deadline, and solana return address.",
		handler: handleContractCreate,
	},
	{
		name: "contract_formation_help",
		description:
			"Call if the user seems to want to form an accountability contract, but has not provided all of the following: a goal, deadline, and solana return address.",
		handler: handleContractFormationHelp,
	},
	{
		name: "contract_verification",
		description:
			"Call if the user wants to verify they have fulfilled a contract.",
		handler: handleContractVerification,
	},
	{
		name: "contract_cancel",
		description:
			"Call if the user made a contract in the last couple of hours and wants to cancel it.",
		handler: handleContractCancel,
	},
];
