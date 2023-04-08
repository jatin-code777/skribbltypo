﻿// Only way to catch errors since: https://github.com/mknichel/javascript-errors#content-scripts. Paste in every script which should trace bugs.
window.onerror = (errorMsg, url, lineNumber, column, errorObj) => { if (!errorMsg) return; errors += "`❌` **" + (new Date()).toTimeString().substr(0, (new Date()).toTimeString().indexOf(" ")) + ": " + errorMsg + "**:\n" + ' Script: ' + url + ' \nLine: ' + lineNumber + ' \nColumn: ' + column + ' \nStackTrace: ' + errorObj + "\n\n"; }

/*
 * Extends service.js contentscript
  Command detection:
  - commands are registered in the commands array
  - consist of actions
  - performCommand finds a suitable comamnd & executes the ommands actions with applied parameters / arguemnts

    heheheh now this is finally hot reworked code and not a fucking mess anymore
*/

const commands = [
    {
        command: "charbar",
        options: {
            type: "toggle",
            description: "Sets the charbar visibility.",
            actionBefore: null,
            actionEnable: () => {
                localStorage.charbar = "true";
            },
            actionDisable: () => {
                localStorage.charbar = "false";
            },
            actionAfter: (args) => {
                QS("#game-chat .chat-container form input").dispatchEvent(new Event("keyup"));
            },
            response: (state) => {
                return (state ? "Enabled" : "Disabled") + " char count.";
            }
        }
    }, {
        command: "controls",
        options: {
            type: "toggle",
            description: "Sets the controls visibility.",
            actionBefore: null,
            actionEnable: () => {
                localStorage.controls = "true";
                QS("#controls").style.display = "flex";
            },
            actionDisable: () => {
                localStorage.controls = "false";
                QS("#controls").style.display = "none";
            },
            actionAfter: null,
            response: (state) => {
                return (state ? "Enabled" : "Disabled") + " controls.";
            }
        }
    }, {
        command: "palantir",
        options: {
            type: "toggle",
            description: "Sets the palantir visibility.",
            actionBefore: null,
            actionEnable: () => {
                localStorage.palantir = "true";
                lobbies.userAllow = true;
                if (lobbies.inGame && !lobbies.joined) {
                    socket.joinLobby(lobbies.lobbyProperties.Key);
                    lobbies.joined = true;
                }
                if (lobbies.inGame) socket.setLobby(lobbies.lobbyProperties, lobbies.lobbyProperties.Key);
            },
            actionDisable: () => {
                localStorage.palantir = "false";
                lobbies.userAllow = false;
                if (lobbies.joined) socket.leaveLobby();
                lobbies.joined = false;
            },
            actionAfter: null,
            response: (state) => {
                return "You're now " + (state ? "visible" : "invisible") + " on Palantir.";
            }
        }
    }, {
        command: "typotoolbar",
        options: {
            type: "toggle",
            description: "Sets the toolbar style.",
            actionBefore: null,
            actionEnable: () => {
                localStorage.typotoolbar = "true";
                QS("#game-toolbar").classList.add("typomod");
            },
            actionDisable: () => {
                localStorage.typotoolbar = "false";
                QS("#game-toolbar").classList.remove("typomod");
            },
            actionAfter: null,
            response: (state) => {
                return "The toolbar style is now " + (state ? "typo-modded" : "original") + ".";
            }
        }
    }, {
        command: "clr",
        options: {
            type: "action",
            description: "Deletes all but the last 50 messages.",
            actionBefore: null,
            actionEnable: null,
            actionDisable: null,
            actionAfter: (args) => {
                let elems = [...QSA("#game-chat .chat-container .chat-content > *")];
                if (elems.length > 50) elems = elems.slice(0, -50);
                elems.forEach(elem => elem.remove());
            },
            response: (args) => {
                return "Removed all but the last 50 messages.";
            }
        }
    }, {
        command: "chatcommands",
        options: {
            type: "toggle",
            description: "Sets the chat command detection feature.",
            actionBefore: null,
            actionEnable: () => {
                localStorage.chatcommands = "true";
            },
            actionDisable: () => {
                localStorage.chatcommands = "false";
            },
            actionAfter: null,
            response: (state) => {
                return (state ? "Enabled" : "Disabled") + " chat commands.";
            }
        }
    }, {
        command: "experimental",
        options: {
            type: "toggle",
            description: "Sets the experimental features.",
            actionBefore: null,
            actionEnable: () => {
                localStorage.experimental = "true";
            },
            actionDisable: () => {
                localStorage.experimental = "false";
            },
            actionAfter: null,
            response: (state) => {
                return (state ? "Enabled" : "Disabled") + " experimental features.";
            }
        }
    }, {
        command: "emojipicker",
        options: {
            type: "toggle",
            description: "Sets the emoji picker visibility.",
            actionBefore: null,
            actionEnable: () => {
                localStorage.emojipicker = "true";
            },
            actionDisable: () => {
                localStorage.emojipicker = "false";
            },
            actionAfter: null,
            response: (state) => {
                return (state ? "Enabled" : "Disabled") + " the emoji picker.";
            }
        }
    }, {
        command: "drops",
        options: {
            type: "toggle",
            description: "Sets the drop visibility.",
            actionBefore: null,
            actionEnable: () => {
                localStorage.drops = "true";
            },
            actionDisable: () => {
                localStorage.drops = "false";
            },
            actionAfter: null,
            response: (state) => {
                return "Drops " + (!state ? "won't show anymore" : "will be visible") + " on the canvas.";
            }
        }
    }, {
        command: "dropmsgs",
        options: {
            type: "toggle",
            description: "Sets visibility of the drop message of others.",
            actionBefore: null,
            actionEnable: () => {
                localStorage.dropmsgs = "true";
            },
            actionDisable: () => {
                localStorage.dropmsgs = "false";
            },
            actionAfter: null,
            response: (state) => {
                return "Drop messages of others " + (!state ? "won't show anymore" : "will be visible") + " in the chat.";
            }
        }
    }, {
        command: "zoomdraw",
        options: {
            type: "toggle",
            description: "Sets the zoom draw feature.",
            actionBefore: null,
            actionEnable: () => {
                localStorage.zoomdraw = "true";
            },
            actionDisable: () => {
                localStorage.zoomdraw = "false";
                uiTweaks.resetZoom();
            },
            actionAfter: null,
            response: (state) => {
                return (state ? "Enabled" : "Disabled") + " canvas zoom (STRG+Click).";
            }
        }
    }, {
        command: "like",
        options: {
            type: "action",
            description: "Executes a like.",
            actionBefore: null,
            actionEnable: null,
            actionDisable: null,
            actionAfter: (args) => {
                QS("#game-rate .like").dispatchEvent(new Event("click"));
            },
            response: (args) => {
                return "You liked " + getCurrentOrLastDrawer() + "s drawing.";
            }
        }
    }, {
        command: "shame",
        options: {
            type: "action",
            description: "Executes a dislike.",
            actionBefore: null,
            actionEnable: null,
            actionDisable: null,
            actionAfter: (args) => {
                QS("#game-rate .dislike").dispatchEvent(new Event("click"));
            },
            response: (args) => {
                return "You disliked " + getCurrentOrLastDrawer() + "s drawing.";
            }
        }
    }, {
        command: "typotools",
        options: {
            type: "toggle",
            description: "Shows or hides the typo tools.",
            actionBefore: null,
            actionEnable: () => {
                localStorage.typotools = "true";
                /* QS("#randomColor").style.display = "";
                QS("#colPicker").style.display = ""; */
                QS("#typotoolbar").style.display = "";
            },
            actionDisable: () => {
                localStorage.typotools = "false";
                /* QS("#randomColor").style.display = "none";
                QS("#colPicker").style.display = "none"; */
                QS("#typotoolbar").style.display = "none";
            },
            actionAfter: null,
            response: (state) => {
                return (state ? "Enabled" : "Disabled") + " random color & color picker tools.";
            }
        }
    }, {
        command: "agent",
        options: {
            type: "toggle",
            description: "Sets the agent feature.",
            actionBefore: null,
            actionEnable: () => {
                localStorage.agent = "true";
                QS("#imageAgent").style.display = "";
            },
            actionDisable: () => {
                localStorage.agent = "false";
                QS("#imageAgent").style.display = "none";
            },
            actionAfter: (state) => {
                scrollMessages();
            },
            response: (state) => {
                return (state ? "Enabled" : "Disabled") + " image agent.";
            }
        }
    }, {
        command: "typoink",
        options: {
            type: "toggle",
            description: "Enables typo's ink drawing instead built-in.",
            actionBefore: null,
            actionEnable: () => {
                localStorage.typoink = "true";
            },
            actionDisable: () => {
                localStorage.typoink = "false";
            },
            actionAfter: null,
            response: (state) => {
                return (state ? "Enabled" : "Disabled") + " typo inkmodes.";
            }
        }
    }, {
        command: "quickreact",
        options: {
            type: "toggle",
            description: "Sets the quickreact feature.",
            actionBefore: null,
            actionEnable: () => {
                localStorage.quickreact = "true";
            },
            actionDisable: () => {
                localStorage.quickreact = "false";
            },
            actionAfter: null,
            response: (state) => {
                return (state ? "Enabled" : "Disabled") + " quick reaction menu.";
            }
        }
    }, {
        command: "markup",
        options: {
            type: "toggle",
            description: "Sets the markup feature.",
            actionBefore: null,
            actionEnable: () => {
                localStorage.markup = "true";
            },
            actionDisable: () => {
                localStorage.markup = "false";
            },
            actionAfter: null,
            response: (state) => {
                return (state ? "Enabled" : "Disabled") + " chat markup.";
            }
        }
    }, {
        command: "setmember",
        options: {
            type: "action",
            description: "Sets the logged in member. Argument: member json",
            actionBefore: null,
            actionEnable: null,
            actionDisable: null,
            actionAfter: (args) => {
                localStorage.member = args;
            },
            response: (args) => {
                return "Logged in!";
            }
        }
    }, {
        command: "kick",
        options: {
            type: "action",
            description: "Kicks a player. Press AltGr to view player IDs. Argument: player ID",
            actionBefore: null,
            actionEnable: null,
            actionDisable: null,
            actionAfter: (args) => {
            },
            response: (args) => {
                let kickPlayer = QS("div[playerid='" + args + "']");
                if (!kickPlayer) kickPlayer = QS(".player .drawing[style*='block'").closest(".player");
                if (kickPlayer) document.dispatchEvent(newCustomEvent("socketEmit", { detail: { id: 5, data: parseInt(kickPlayer.getAttribute("playerid")) } }));
                return kickPlayer ? "Executed kick for " + kickPlayer.querySelector(".player-name").textContent.replace("(You)", "").trim() : "No-one to kick :(";
            }
        }
    }, {
        command: "randominterval",
        options: {
            type: "action",
            description: "Sets the random interval. Argument: interval in ms",
            actionBefore: null,
            actionEnable: null,
            actionDisable: null,
            actionAfter: (args) => {
                localStorage.randominterval = args;
            },
            response: (args) => {
                return "The random color brush interval is now " + args + "ms.";
            }
        }
    }, {
        command: "markupcolor",
        options: {
            type: "action",
            description: "Sets the markup color. Argument: degree component of HSL",
            actionBefore: null,
            actionEnable: null,
            actionDisable: null,
            actionAfter: (args) => {
                localStorage.markupcolor = args;
            },
            response: (args) => {
                const color = new Color({ h: Number(args), s: 100, l: 90 });
                return "The highlight color for your messages is now " + color.hex + ".";
            }
        }
    }, {
        command: "sens",
        options: {
            type: "action",
            description: "Sets the pressure sensitivity. Argument: sensitivity",
            actionBefore: null,
            actionEnable: null,
            actionDisable: null,
            actionAfter: (args) => {
                localStorage.sens = args;
            },
            response: (args) => {
                return "Tablet pressure sensitivity is now at " + args + "%.";
            }
        }
    }, {
        command: "usepalette",
        options: {
            type: "action",
            description: "Uses a palette. Argument: palette name",
            actionBefore: null,
            actionEnable: null,
            actionDisable: null,
            actionAfter: (args) => {
                if (uiTweaks.palettes.some(palette => palette.name == args)) localStorage.palette = args;
                uiTweaks.palettes.find(palette => palette.name == args)?.activate();
            },
            response: (args) => {
                return localStorage.palette == args ? "Activated custom palette " + args + "." : "Custom palette not found :(";
            }
        }
    }, {
        command: "addpalette",
        options: {
            type: "action",
            description: "Adds a palette. Argument: palette json",
            actionBefore: null,
            actionEnable: null,
            actionDisable: null,
            actionAfter: (args) => {
                uiTweaks.palettes.push(createColorPalette(JSON.parse(args)));
                let palettesSave = [];
                uiTweaks.palettes.forEach(palette => {
                    if (palette.json) palettesSave.push(JSON.parse(palette.json));
                });
                localStorage.customPalettes = JSON.stringify(palettesSave);
            },
            response: (args) => {
                return "Added custom palette:" + JSON.parse(args).name;
            }
        }
    }, {
        command: "rempalette",
        options: {
            type: "action",
            description: "Removes a palette. Argument: palette name",
            actionBefore: null,
            actionEnable: null,
            actionDisable: null,
            actionAfter: (args) => {
                uiTweaks.palettes = uiTweaks.palettes.filter(palette => palette.name != args);
                let palettesSave = [];
                uiTweaks.palettes.forEach(palette => {
                    if (palette.json) palettesSave.push(JSON.parse(palette.json));
                });
                localStorage.customPalettes = JSON.stringify(palettesSave);
            },
            response: (args) => {
                return "Removed palette(s) with name:" + args;
            }
        }
    }, {
        command: "help",
        options: {
            type: "action",
            description: "Shows some help about chat commands.",
            actionBefore: null,
            actionEnable: null,
            actionDisable: null,
            actionAfter: () => {
                let help = "<div style='padding:.5em;'><h4>Overview of commands</h4><small><b>Types of commands:</b><br>Toggle - use with 'enable' / 'disable' + command name.<br>Action - execute with command name + arguments.<br><br>";
                help += "<h4>Commands:</h4>";
                commands.forEach(cmd => {
                    help += `<b>${cmd.command} (${cmd.options.type}):</b> ${cmd.options.description}<br><br>`;
                });
                help += "</small></div>";
                QS("#game-chat .chat-container .chat-content").appendChild(elemFromString(help));
            },
            response: (args) => {
                return "";
            }
        }
    }, {
        command: "resettypo",
        options: {
            type: "action",
            description: "Resets everything to the defaults.",
            actionBefore: null,
            actionEnable: null,
            actionDisable: null,
            actionAfter: () => {
                setDefaults(true);
                window.location.reload();
            },
            response: (args) => {
                return "";
            }
        }
    }, {
        command: "newvision",
        options: {
            type: "action",
            description: "Open a new image overlay.",
            actionBefore: null,
            actionEnable: null,
            actionDisable: null,
            actionAfter: () => {
                new Vision();
            },
            response: (args) => {
                return "Overlay opened.";
            }
        }
    }

];

let simpleCommands = [];

const performCommand = (command) => {
    // get raw command
    command = command.replace("--", "").trim();
    let toggle = null;
    // check if command is toggle
    if (command.startsWith("enable")) toggle = true;
    else if (command.startsWith("disable")) toggle = false;
    command = command.replace("enable", "").replace("disable", "").trim();
    // extract args
    const args = command.includes(" ") ? command.substr(command.indexOf(" ")).trim() : "";
    command = command.replace(args, "").trim();
    match = false;
    // find matching command
    commands.forEach(cmd => {
        if (cmd.command.startsWith(command) && command.includes(cmd.command) && !match) {
            match = true;
            // execute command actions
            if (cmd.options.actionBefore) cmd.options.actionBefore(args);
            if (cmd.options.type == "toggle") if (toggle == true) cmd.options.actionEnable();
            else cmd.options.actionDisable();
            if (cmd.options.actionAfter) cmd.options.actionAfter(args);
            const response = cmd.options.response(cmd.options.type == "toggle" ? toggle : args);
            // print output
            QS("#game-chat .chat-container .chat-content").appendChild(
                elemFromString(`<p><b style="color: var(--COLOR_CHAT_TEXT_DRAWING);">Command: ${cmd.command}</b><br><span style="color var(--COLOR_CHAT_TEXT_DRAWING);">${response}</span></p>`));
        }
    });
    if (!match) {
        // print error - no matching command 
        QS("#game-chat .chat-container .chat-content").appendChild(
            elemFromString(`<p><b style="color: var(--COLOR_CHAT_TEXT_DRAWING);">Command failed: ${command}</b><br><span style="color: var(--COLOR_CHAT_TEXT_DRAWING);">Not found :(</span></p>`));
    }
    scrollMessages();
}

const addChatMessage = (title, content) => {
    let box = document.querySelector(".chat-content");
    let scroll = Math.floor(box.scrollHeight - box.scrollTop) <= box.clientHeight + 30;
    box.appendChild(
        elemFromString(`<p>${title != "" ? `<b style="color: var(--COLOR_CHAT_TEXT_DRAWING);">${title}</b><br>` : ""}<span style="color: var(--COLOR_CHAT_TEXT_DRAWING);">${content}</span></p>`));
    if (scroll) scrollMessages();
}