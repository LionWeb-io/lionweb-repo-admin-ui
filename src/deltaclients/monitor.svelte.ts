import { DeltaClient } from "@lionweb/server-delta-client";
import {
    type Custom_MonitorStartMonitor,
    isDeltaMonitor,
    type MessageFromClient,
    type MessageToClient,
    type SignOnRequest
} from "@lionweb/server-delta-shared";
import { Client, clients } from "./clients.svelte.js";

export type MonitorMessage = {
    messageKind: "Monitor"
    clientId: string
    repository: string
    delta: MessageToClient | MessageFromClient
}

function isMonitorMessage(object: object): object is MonitorMessage {
    return (object as any)["messageKind"] === "Monitor"
}

export class Monitor {
    monitorClient: DeltaClient;
    
    activeClients: Map<string, Client> = new Map<string, Client>()
    
    private static theInstance: Monitor;
    
    static getInstance(): Monitor {
        if (Monitor.theInstance === undefined) {
            Monitor.theInstance = new Monitor()
        }    
        return Monitor.theInstance
    }
    
    private constructor() {
        this.monitorClient = new DeltaClient("monitor", { hostname: "localhost", port: 3005 }, []);
        this.monitorClient.loggingOn = false;
        this.monitorClient.customFunctionOnly = true
        this.monitorClient.customFunction = (msg: object) => {
            if (isMonitorMessage(msg)) {
                const clientId = msg.clientId;
                const repository = msg.repository;
                const delta = msg.delta;
                console.log(`Monitor kind '${delta.messageKind}' client '${clientId} repo ${repository}'`);
                if (clientId === undefined) {
                    return;
                }
                let client = this.activeClients.get(clientId);
                if (client === undefined) {
                    console.log(`NEW CLIENT ${clientId}`);
                    client = new Client(clientId, repository);
                    this.activeClients.set(clientId, client);
                    clients.push(client);
                }
                client.messages.push(delta);
                // console.log(`DELTA: ${JSON.stringify(client)}`);
            } else {
                // ignore non monitor messages
            }
        };
        const request: SignOnRequest = {
            messageKind: "SignOnRequest",
            repositoryId: "MyBulkImportRepo",
            deltaProtocolVersion: "2023.1",
            clientId: "client.clientId",
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
