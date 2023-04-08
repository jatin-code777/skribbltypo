import { TypoXApiClient, typoCommand } from "./api";

export abstract class TypoExtension {

    protected extensionCommands: Array<typoCommand> = [];

    private apiClient: TypoXApiClient;

    constructor() {
        this.apiClient = new TypoXApiClient();
    }

    abstract onInit(): void;
    abstract onDestroy(): void;

    protected async request(resource: string): Promise<any> {
        return this.apiClient.request(resource);
    }

    public initExtension() {

        /* run init code */
        this.onInit();

        /* register commands, if present */
        if (this.extensionCommands.length > 0) {
            this.request("commands").then((commands: Array<typoCommand>) => {

                /* add command */
                this.extensionCommands.forEach(command => {

                    /* check if command exists */
                    if (commands.some(c => c.command == command.command)) {
                        throw new Error("Command did already exist: " + command.command);
                    }

                    commands.push(command);
                });
            });
        }
    }

    public destroyExtension() {

        /* run destroy code */
        this.onDestroy();

        /* unregister comamnds */
        if (this.extensionCommands.length > 0) {
            this.request("commands").then((commands: Array<typoCommand>) => {

                /* filter commands */
                this.extensionCommands.forEach(command => {

                    /* find index */
                    let index = commands.findIndex(c => c.command == command.command);
                    if (index) {
                        commands.splice(index, 1);
                    }
                });
            });
        }
    }
}