declare const addChatMessage: (title: string, content: string) => void;
declare const commands: Array<typoCommand>;

export interface toggleCommandOptions {
    type: "toggle";
    description: string;
    actionBefore: null | (() => void);
    actionEnable: (() => void);
    actionDisable: (() => void);
    actionAfter: null | ((state: boolean) => void);
    response: ((state: boolean) => string);
}

export interface actionCommandOptions {
    type: "action";
    description: string;
    actionBefore: null | (() => void);
    actionEnable: null;
    actionDisable: null;
    actionAfter: null | ((args: string) => void);
    response: ((args: string) => string);
}


export interface typoCommand {
    command: string;
    options: toggleCommandOptions | actionCommandOptions;
}

export interface resourceRequestEvent {
    id: number;
    resource: string;
}

export interface resourceResponseEvent {
    id: number;
    resource: any;
    found: boolean;
}

export class TypoXApiClient {

    private requests = 0;
    private port: MessagePort;

    constructor() {
        const channel = new MessageChannel();
        this.port = channel.port1;
        window.postMessage(channel.port2, "*", [channel.port2]);
    }

    async request(resource: string) {
        return new Promise((resolve, reject) => {
            const id = this.requests++;

            const handler = (event: MessageEvent) => {

                const response: resourceResponseEvent = event.data;

                console.info("[XAPI] 🠆  received ", response);

                /* not for this request */
                if (response.id != id) return;

                /* unsubscribe handler */
                this.port.removeEventListener("message", handler);

                if (response.found) resolve(response.resource);
                else reject("Resource could not be found");
            }

            this.port.addEventListener("message", handler);

            const request: resourceRequestEvent = {
                id: id,
                resource: resource
            }

            this.port.postMessage(request);
        });
    }
}

export class TypoXApiHost {

    private messageChannels: Array<MessagePort> = [];

    constructor() {
        this.listen();
    }

    private readonly access: { [key: string]: any } = {
        addMessage: addChatMessage,
        commands: commands
    };

    private listen() {

        window.addEventListener("message", event => {
            if (event.data instanceof MessagePort) {

                console.info("[XAPI] new listener added");

                const port: MessagePort = event.data;
                this.messageChannels.push(port);

                port.onmessage = (message) => {
                    const request: resourceRequestEvent = message.data;

                    console.info("[XAPI] 🠄  requested ", request);

                    let resource = this.access[request.resource];

                    const response: resourceResponseEvent = {
                        id: request.id,
                        resource: resource,
                        found: false
                    };

                    if (resource != undefined) {
                        response.found = true;
                    }

                    port.postMessage(response);
                }
            }
        });
    }
}




