import { DeltaClient } from "@lionweb/server-delta-client";
import {
    type Custom_MonitorStartMonitor, type DeltaEvent, isDeltaAdminRequest, isDeltaAdminResponse, isDeltaCommand, isDeltaEvent,
    isDeltaMonitor, isDeltaRequest, isDeltaResponse,
    type MessageFromClient,
    type MessageToClient,
    type SignOnRequest
} from "@lionweb/server-delta-shared";
import { SvelteMap } from "svelte/reactivity";
import { Client, clients } from "./clients.svelte.js";

export type MonitorMessage = {
    messageKind: "Monitor"
    clientId: string
    participationId: string
    repositoryName: string
    delta: MessageToClient | MessageFromClient
}

export function mmId(m: MonitorMessage): string {
        if (isDeltaResponse(m.delta)) {
            return m.clientId + m.delta.queryId + m.delta.messageKind;
        } else if (isDeltaEvent(m.delta)) {
            return m.clientId + m.delta.messageKind + m.delta.originCommands.map((or) => or.commandId).join(",");
        } else if (isDeltaCommand(m.delta)) {
            return m.clientId + m.delta.commandId + m.delta.messageKind;
        } else if (isDeltaRequest(m.delta)) {
            return m.clientId + m.delta.queryId + m.delta.messageKind;
        } else {
            return "???" + m.delta.messageKind;
        }
    }

export function isFromClient(delta: MessageToClient | MessageFromClient): delta is MessageFromClient {
    return isDeltaCommand(delta) || isDeltaRequest(delta) || isDeltaAdminRequest(delta)
}
export function isToClient(delta: MessageToClient | MessageFromClient): delta is MessageToClient {
    return isDeltaEvent(delta) || isDeltaResponse(delta) || isDeltaAdminResponse(delta)
}

/**
 * Is `target` delta (sent to a client) the result of `src` delta (send to server)?
 * @param src
 * @param target
 */
export function causes(src: MonitorMessage, target: MonitorMessage): boolean {
    if (isDeltaCommand(src.delta) && isDeltaEvent(target.delta)) {
        const srcDelta = src.delta
        return target.delta.originCommands.find(origin => {
            return origin.commandId === srcDelta.commandId &&
            origin.participationId === src.participationId
            }) != undefined
    } else if(isDeltaRequest(src.delta) && isDeltaResponse(target.delta)) {
        const srcDelta = src.delta
        const tgtDelta = target.delta
        return tgtDelta.queryId === srcDelta.queryId &&
            src.participationId === target.participationId
    } else if(isDeltaAdminRequest(src.delta) && isDeltaAdminResponse(target.delta)) {
        const srcDelta = src.delta
        const tgtDelta = target.delta
        return tgtDelta.queryId === srcDelta.queryId &&
            src.participationId === target.participationId
    }
    return false
}

export function getId(message: MessageFromClient | MessageToClient): string {
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

function isMonitorMessage(object: object): object is MonitorMessage {
    return (object as any)["messageKind"] === "Monitor"
}


export class Monitor {
    monitorClient: DeltaClient;
    allMessages: MonitorMessage[] = $state([]);
    clientToColum: SvelteMap<string, number> = $state(new SvelteMap<string, number>());
    messageToRow: SvelteMap<string, number> = $state(new SvelteMap<string, number>());
    activeClients: SvelteMap<string, Client> = $state(new SvelteMap<string, Client>());

    private static theInstance: Monitor;

    static getInstance(): Monitor {
        if (Monitor.theInstance === undefined) {
            Monitor.theInstance = new Monitor();
        }
        return Monitor.theInstance;
    }

    private nextClientColumn = 1;
    private nextMessageRow = 2;

    private constructor() {
        this.monitorClient = new DeltaClient("monitor", { hostname: "localhost", port: 3005 }, []);
        this.monitorClient.loggingOn = false;
        this.monitorClient.customFunctionOnly = true;
        this.monitorClient.customFunction = (msg: object) => {
            if (isMonitorMessage(msg)) {
                const clientId = msg.clientId;
                const repository = msg.repositoryName;
                const delta = msg.delta;
                if (clientId === undefined) {
                    return;
                }
                let client = this.activeClients.get(clientId);
                if (client === undefined) {
                    console.log(`NEW CLIENT MONITOR ${clientId}`);
                    client = new Client(clientId, msg.participationId, repository);
                    this.activeClients.set(clientId, client);
                    clients.push(client);
                    this.clientToColum.set(clientId, this.nextClientColumn++);
                }
                client.messages.push(delta);
                if (isFromClient(msg.delta) ) {
                    this.messageToRow.set(mmId(msg), this.nextMessageRow++);
                } else {
                    this.messageToRow.set(mmId(msg), this.nextMessageRow++);
                }
                console.log(`ROW ${msg.clientId}.${msg.delta.messageKind} is ${this.messageToRow.get(mmId(msg))}`)
                this.allMessages.push(msg);
            } else {
                // ignore non monitor messages
            }
        };
        const request: SignOnRequest = {
            messageKind: "SignOnRequest",
            repositoryId: "MyBulkImportRepo",
            deltaProtocolVersion: "2023.1",
            clientId: "monitor",
            queryId: `signOn-${22}`,
            additionalInfos: []
        };
        const monitorMessage: Custom_MonitorStartMonitor = {
            additionalInfos: [],
            messageKind: "Custom_MonitorStart",
            queryId: "id",
            repositoryName: "MyBulkImportRepo"
        };
        this.monitorClient.connect().then(() => {
            this.monitorClient.sendRequest(request);
            this.monitorClient.sendMonitorRequest(monitorMessage);
        });
    }
}
