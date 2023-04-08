import { typoCommand } from "../api";
import { TypoExtension } from "../extension";

export class TimerExtension extends TypoExtension {

    protected extensionCommands: typoCommand[] = [
        {
            command: "timer",
            options: {
                type: "action",
                description: "Starts a new timer. Usage: timer [seconds] [message]",
                actionBefore: null,
                actionEnable: null,
                actionDisable: null,
                actionAfter: (args) => {
                    const timer = this.parseTimerArguments(args);
                    setTimeout(async () => {
                        const addMsg = await this.request("addChatMessage");
                        addMsg("Timer is due!", timer.message);
                    }, timer.time * 1000);
                },
                response: (args) => {
                    const timer = this.parseTimerArguments(args);
                    return `Started new timer for ${timer.time}s.`;
                }
            }
        }
    ]

    onInit(): void {
        console.log("Method not implemented.");
    }
    onDestroy(): void {
        console.log("Method not implemented.");
    }

    constructor() {
        super();
    }

    parseTimerArguments(args: string) {
        let time = Number(args.split(" ")[0]);
        if (Number.isNaN(time)) time = 60;
        let message = args.split(" ").slice(1).join(" ");
        return { time, message };
    }

}