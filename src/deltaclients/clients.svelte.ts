import {
    isDeltaCommand,
    isDeltaEvent,
    isDeltaRequest,
    isDeltaResponse,
    type MessageFromClient,
    type MessageToClient
} from "@lionweb/server-delta-shared";

export class a {
    
}

export class Client {
    id: string;
    repository: string;
    participation: string;
    messages: (MessageFromClient | MessageToClient)[] = $state([]);

    constructor(id: string, participation: string, repo: string) {
        this.id = id;
        this.participation = participation
        this.repository = repo;
    }

    getId(message: MessageFromClient | MessageToClient): string {
        if (isDeltaResponse(message)) {
            return message.queryId;
        } else if (isDeltaEvent(message)) {
            return message.originCommands.map((or) => or.commandId).join(",");
        } else if (isDeltaCommand(message)) {
            return message.commandId;
        } else if (isDeltaRequest(message)) {
            return message.queryId;
        } else {
            return "???";
        }
    }
}
export const clients: Client[] = $state([]);

export function addClient(client: Client): void {
    console.log("ADD CLIENT");
    clients.push(client);
}
