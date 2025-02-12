const stateFromLocalstorage = (modeName, defaultState, stateOverride = undefined) => {
    let keyname = "brushmagic_" + modeName;

    if(stateOverride === false || stateOverride != undefined) {
        localStorage.setItem(keyname, JSON.stringify(stateOverride));
        return stateOverride;
    }
    else if(!localStorage.getItem(keyname)) {
        localStorage.setItem(keyname, JSON.stringify(defaultState));
        return defaultState;
    }
    else return JSON.parse(localStorage.getItem(keyname));
}

const brushtools = {
    groups: {
        color: {
            /*rainbow: {
                name: "Rainbow",
                description: "The brush color is a rainbow color depending on your pen pressure.",
                enabled: false,
                options: {
				},
                enable: () => {
                    for (let [name, mode] of Object.entries(brushtools.groups.color)){
                        mode.disable();
                    }
                    brushtools.groups.color.rainbow.enabled = true;
                    gamemodes.modes.find(mode => mode.name == "Monochrome").options.destroy();
                },
                disable: () => {
                    brushtools.groups.color.rainbow.enabled = false;
                },
                pointermoveCallback: (event) => {
                    if (event.pressure > 0 && event.pointerType == "pen") {
                        const colors = brushtools.getColorsHue();
                        const index = Math.round(event.pressure * (colors.length - 1));
                        const color = colors[index][2].hex;
                        colcode = parseInt(color.toString().replace("#", ""), 16) + 10000;
                        if (colcode != 10000 + 16777215) document.dispatchEvent(newCustomEvent("setColor", { detail: { code: colcode } }));
					}
				}
            },
            brightness: {
                name: "Brightness",
                description: "The brightness of a selected color varies with pen pressure.",
                enabled: false,
                options: {
                },
                enable: () => {
                    for (let [name, mode] of Object.entries(brushtools.groups.color)) {
                        mode.disable();
                    }
                    gamemodes.modes.find(mode => mode.name == "Monochrome").options.destroy();
                    brushtools.groups.color.brightness.enabled = true;
                },
                disable: () => {
                    brushtools.groups.color.brightness.enabled = false;
                },
                pointermoveCallback: (event) => {
                    if (event.pressure > 0 && event.pointerType == "pen") {
                        const selected = QS("#color-preview-primary").style.fill;
                        const matchGroup = brushtools.colorGroups.find(group => group.some(col => col == selected));
                        const index = Math.round(event.pressure * (matchGroup.length - 1));
                        const color = new Color({ rgb: matchGroup[index] });
                        colcode = parseInt(color.hex.toString().replace("#", ""), 16) + 10000;
                        document.dispatchEvent(newCustomEvent("setColor", { detail: { code: colcode } }));
                    }
                }
            },*/
            rainbowcircle: {
                name: "Rainbow Cycle",
                description: "Cycles through bright rainbow colors, no pen needed.",
                enabled: stateFromLocalstorage("color.rainbowcircle", false),
                options: {
                },
                enable: () => {
                    for (let [name, mode] of Object.entries(brushtools.groups.color)) {
                        mode.disable();
                    }
                    brushtools.groups.color.rainbowcircle.lastSwitch = 0;
                    brushtools.groups.color.rainbowcircle.lastIndex = 0;
                    brushtools.groups.color.rainbowcircle.direction = 1;
                    brushtools.groups.color.rainbowcircle.enabled = stateFromLocalstorage("color.rainbowcircle", undefined, true);
                    gamemodes.modes.find(mode => mode.name == "Monochrome").options.destroy();
                },
                disable: () => {
                    brushtools.groups.color.rainbowcircle.enabled = stateFromLocalstorage("color.rainbowcircle", undefined, false);
                },
                pointermoveCallback: (event) => {
                    const colors = ["ef130b", "ff7100", "ffe400", "00cc00", "00ff91", "00b2ff", "231fd3", "a300ba", "d37caa"];
                    if (event.pressure > 0) {
                        const interval = parseInt(localStorage.randominterval)
                        if (Date.now() - brushtools.groups.color.rainbowcircle.lastSwitch > interval) {
                            brushtools.groups.color.rainbowcircle.lastSwitch = Date.now();
                            let index = brushtools.groups.color.rainbowcircle.lastIndex;
                            if (brushtools.groups.color.rainbowcircle.direction > 0) {
                                if (++index >= colors.length) {
                                    brushtools.groups.color.rainbowcircle.direction *= -1;
                                    index = colors.length - 1;
                                }
                            }
                            else {
                                if (--index < 0) {
                                    brushtools.groups.color.rainbowcircle.direction *= -1;
                                    index = 1;
                                }
                            }
                            brushtools.groups.color.rainbowcircle.lastIndex = index;
                            document.dispatchEvent(newCustomEvent("setColor", { detail: { code: parseInt(colors[index], 16) + 10000 } }));
                        }
                    }
                }
            }
		},
        mirror: {
            mandala: {
                name: "Mandala",
                description: "The brush is mirrored on either the X-axis, Y-axis or both.",
                enabled: stateFromLocalstorage("mirror.mandala", false),
                options: {
                    axis: {
                        val: stateFromLocalstorage("mirror.mandala.options.axis", "X"),
                        type: ["X", "XY", "Y"],
                        save: value => stateFromLocalstorage("mirror.mandala.options.axis", undefined, value)
                    },
                    mirrorpoint: {
                        val: stateFromLocalstorage("mirror.mandala.options.mirrorpoint", "Center"),
                        type: ["Center", "Click"],
                        save: value => stateFromLocalstorage("mirror.mandala.options.mirrorpoint", undefined, value)
                    }
                },
                enable: () => {
                    for (let [name, mode] of Object.entries(brushtools.groups.mirror)) {
                        mode.disable();
                    }
                    for (let [name, mode] of Object.entries(brushtools.groups.stroke)) {
                        mode.disable();
                    }
                    brushtools.groups.mirror.mandala.enabled = stateFromLocalstorage("mirror.mandala", undefined, true);
                },
                disable: () => {
                    brushtools.groups.mirror.mandala.enabled = stateFromLocalstorage("mirror.mandala", undefined, false);
                },
                pointermoveCallback: (event) => {

                    event.preventDefault();
                    event.stopPropagation();
                    if (event.pressure > 0 && !event.ctrlKey) {

                        if (event.type == "pointerdown") {
                            brushtools.groups.mirror.mandala.lastDownPos = [event.offsetX, event.offsetY];
                        }

                        const mirror = brushtools.groups.mirror.mandala.options.axis.val;
                        const point = brushtools.groups.mirror.mandala.options.mirrorpoint.val;
                        const lastDown = brushtools.groups.mirror.mandala.lastDownPos;
                        let clone = new PointerEvent("pointermove", event)
                        clone = Object.defineProperty(clone, "button", { value: 0 });
                        const canvasRect = brushtools.canvas.getBoundingClientRect();
                        const sculptX = point == "Center" ? canvasRect.width - event.offsetX : lastDown[0] - ((lastDown[0] - event.offsetX) * -1);
                        const sculptY = point == "Center" ? canvasRect.height - event.offsetY : lastDown[1] - ((lastDown[1] - event.offsetY) * -1);
                        if (mirror.indexOf("X") >= 0) clone = Object.defineProperty(clone, "clientX", { value: canvasRect.left + sculptX });
                        if (mirror.indexOf("Y") >= 0) clone = Object.defineProperty(clone, "clientY", { value: canvasRect.top + sculptY });

                        let lastEvent = brushtools.groups.mirror.mandala.lastEvent;
                        let lastClone = brushtools.groups.mirror.mandala.lastClone;

                        brushtools.line(lastEvent ? lastEvent : event, event, event.pressure);
                        brushtools.line(lastClone ? lastClone : clone, clone, event.pressure);

                        brushtools.groups.mirror.mandala.lastEvent = event;
                        brushtools.groups.mirror.mandala.lastClone = clone;
                    }
                    else {
                        brushtools.groups.mirror.mandala.lastEvent = null;
                        brushtools.groups.mirror.mandala.lastClone = null;
                    }
                }
            },
            sculpt: {
                name: "Sculpt",
                description: "Creates sculptures mirrored on either the X-axis, Y-axis or both.",
                enabled: stateFromLocalstorage("mirror.sculpt", false),
                options: {
                    axis: {
                        val: stateFromLocalstorage("mirror.sculpt.options.axis", "X"),
                        type: ["X", "XY", "Y"],
                        save: value => stateFromLocalstorage("mirror.sculpt.options.axis", undefined, value)
                    },
                    mirrorpoint: {
                        val: stateFromLocalstorage("mirror.sculpt.options.mirrorpoint", "Center"),
                        type: ["Center", "Click"],
                        save: value => stateFromLocalstorage("mirror.sculpt.options.mirrorpoint", undefined, value)
                    }
                },
                enable: () => {
                    for (let [name, mode] of Object.entries(brushtools.groups.mirror)) {
                        mode.disable();
                    }
                    for (let [name, mode] of Object.entries(brushtools.groups.stroke)) {
                        mode.disable();
                    }
                    brushtools.groups.mirror.sculpt.enabled = stateFromLocalstorage("mirror.sculpt", undefined, true);
                },
                disable: () => {
                    brushtools.groups.mirror.sculpt.enabled = stateFromLocalstorage("mirror.sculpt", undefined, false);
                },
                pointermoveCallback: (event) => {

                    event.preventDefault();
                    event.stopPropagation();
                    if (event.pressure > 0 && !event.ctrlKey) {
                        if (event.type == "pointerdown") {
                            brushtools.groups.mirror.sculpt.lastDownPos = [event.offsetX, event.offsetY];
                        }
                        const mirror = brushtools.groups.mirror.sculpt.options.axis.val;
                        const point = brushtools.groups.mirror.sculpt.options.mirrorpoint.val;
                        const lastDown = brushtools.groups.mirror.sculpt.lastDownPos;

                        let clone = new PointerEvent("pointermove", event)
                        const canvasRect = brushtools.canvas.getBoundingClientRect();
                        const sculptX = point == "Center" ? canvasRect.width - event.offsetX : lastDown[0] - ((lastDown[0] - event.offsetX) * -1);
                        const sculptY = point == "Center" ? canvasRect.height - event.offsetY : lastDown[1] - ((lastDown[1] - event.offsetY) * -1);
                        if (mirror.indexOf("X") >= 0) clone = Object.defineProperty(clone, "clientX", { value: canvasRect.left + sculptX });
                        if (mirror.indexOf("Y") >= 0) clone = Object.defineProperty(clone, "clientY", { value: canvasRect.top + sculptY });

                        brushtools.line(event, clone);
                    }
                }
            }
        },
        stroke: {
            dash: {
                name: "Dash",
                description: "Draw dashed lines.",
                enabled: stateFromLocalstorage("stroke.dash", false),
                options: {
                    interval: {
                        val: stateFromLocalstorage("stroke.dash.options.interval", 10),
                        type: "num",
                        save: value => stateFromLocalstorage("stroke.dash.options.interval", undefined, value)
                    }
                },
                enable: () => {
                    for (let [name, mode] of Object.entries(brushtools.groups.mirror)) {
                        mode.disable();
                    }
                    for (let [name, mode] of Object.entries(brushtools.groups.stroke)) {
                        mode.disable();
                    }
                    brushtools.groups.stroke.dash.enabled = stateFromLocalstorage("stroke.dash", undefined, true);
                },
                disable: () => {
                    brushtools.groups.stroke.dash.enabled = stateFromLocalstorage("stroke.dash", undefined, false);
                },
                pointermoveCallback: (event) => {
                    if (event.pressure > 0) {
                        event.preventDefault();
                        event.stopPropagation();
                        if (!brushtools.groups.stroke.dash.wait) {
                            brushtools.groups.stroke.dash.wait = true;
                            let clone = new PointerEvent("pointerdown", event);
                            clone = Object.defineProperty(clone, "button", { value: 0 });
                            brushtools.canvas.dispatchEvent(new PointerEvent("pointerdown", clone));
                            brushtools.canvas.dispatchEvent(new PointerEvent("pointerup", clone));
                            setTimeout(() => {
                                brushtools.groups.stroke.dash.wait = false;
                            }, brushtools.groups.stroke.dash.options.interval.val);
                        }
                        else {
                            let clone = new PointerEvent("pointermove", event);
                            clone = Object.defineProperty(clone, "pressure", { value: 0 });
                            brushtools.canvas.dispatchEvent(new PointerEvent("pointermove", clone));
                        }
                    }
                }
            },
            tilt: {
                name: "Tilt",
                description: "Draw tilted lines.",
                enabled: stateFromLocalstorage("stroke.tilt", false),
                options: {
                    density: {
                        val: stateFromLocalstorage("stroke.tilt.options.density", 5),
                        type: "num",
                        save: value => stateFromLocalstorage("stroke.tilt.options.density", undefined, value)
                    },
                    tilt: {
                        val: stateFromLocalstorage("stroke.tilt.options.tilt", 5),
                        type: "num",
                        save: value => stateFromLocalstorage("stroke.tilt.options.tilt", undefined, value)
                    }
                },
                enable: () => {
                    for (let [name, mode] of Object.entries(brushtools.groups.mirror)) {
                        mode.disable();
                    }
                    for (let [name, mode] of Object.entries(brushtools.groups.stroke)) {
                        mode.disable();
                    }
                    brushtools.groups.stroke.tilt.enabled = stateFromLocalstorage("stroke.tilt", undefined, true);
                },
                disable: () => {
                    brushtools.groups.stroke.tilt.enabled = stateFromLocalstorage("stroke.tilt", undefined, false);
                },
                pointermoveCallback: (event) => {
                    if (event.pressure > 0 ) {
                        const density = brushtools.groups.stroke.tilt.options.density.val;
                        const tilt = brushtools.groups.stroke.tilt.options.tilt.val;
                        for (let i = 1; i < density; i++) {
                            const offset = event.pressure  * tilt;
                            let clone = new PointerEvent("pointermove", event)
                            clone = Object.defineProperty(clone, "clientX", { value: event.clientX - offset - i});
                            clone = Object.defineProperty(clone, "clientY", { value: event.clientY - offset - i});
                            brushtools.canvas.dispatchEvent(new PointerEvent("pointermove", clone));
                        }
                    }
                }
            },
            noise: {
                name: "Noise",
                description: "Draw distorted lines. If you're using a pen, the size is affected by pressure.",
                enabled: stateFromLocalstorage("stroke.noise", false),
                options: {
                    size: {
                        val: stateFromLocalstorage("stroke.noise.options.size", 10),
                        type: "num",
                        save: value => stateFromLocalstorage("stroke.noise.options.size", undefined, value)
                    },
                    direction: {
                        val: stateFromLocalstorage("stroke.noise.options.direction", "top"),
                        type: ["top", "bottom", "left", "right", "vertical", "horizontal", "all"],
                        save: value => stateFromLocalstorage("stroke.noise.options.direction", undefined, value)
                    }
                },
                enable: () => {
                    for (let [name, mode] of Object.entries(brushtools.groups.mirror)) {
                        mode.disable();
                    }
                    for (let [name, mode] of Object.entries(brushtools.groups.stroke)) {
                        mode.disable();
                    }
                    brushtools.groups.stroke.noise.enabled = stateFromLocalstorage("stroke.noise", undefined, true);
                },
                disable: () => {
                    brushtools.groups.stroke.noise.enabled = stateFromLocalstorage("stroke.noise", undefined, false);
                },
                pointermoveCallback: (event) => {
                    if (event.pressure > 0 ) {
                        const density = 4;
                        const direction = brushtools.groups.stroke.noise.options.direction.val;
                        const size = brushtools.groups.stroke.noise.options.size.val * 10;
                        const amount = density; 
                        const offset = event.pressure  * size;
                        
                        for (let i = 1; i < amount; i++) {
                            let vertical = Math.random() * offset * 2 - offset;
                            let horizontal = Math.random() * offset * 2 - offset;

                            switch(direction){
                                case "top":
                                    vertical = -Math.abs(vertical);
                                    horizontal = horizontal * 0.6;
                                    break;
                                case "bottom":
                                    vertical = Math.abs(vertical);
                                    horizontal = horizontal * 0.6;
                                    break;
                                case "left":
                                    horizontal = -Math.abs(horizontal);
                                    vertical = vertical * 0.6;
                                    break;
                                case "right":
                                    horizontal = Math.abs(horizontal);
                                    vertical = vertical * 0.6;
                                    break;
                                case "vertical": 
                                    horizontal = horizontal * 0.3;
                                    break;
                                case "horizontal":
                                    vertical = vertical * 0.3;
                                    break;
                            }

                            let clone = new PointerEvent("pointermove", event);
                            clone = Object.defineProperty(clone, "clientX", { value: event.clientX + horizontal});
                            clone = Object.defineProperty(clone, "clientY", { value: event.clientY + vertical});
                            brushtools.canvas.dispatchEvent(new PointerEvent("pointermove", clone));
                            brushtools.canvas.dispatchEvent(new PointerEvent("pointermove", event));
                        }
                    }
                }
            }
		}
    },
    line: (eventFrom, eventTo) => {
        //let down = Object.defineProperty(eventFrom, "pressure", { value: pressure });
        let down = Object.defineProperty(eventFrom, "button", { value: 0 });

        //let up = Object.defineProperty(eventTo, "pressure", { value: pressure });
        let up = Object.defineProperty(eventTo, "button", { value: 0 });

        brushtools.canvas.dispatchEvent(new PointerEvent("pointerdown", down));
        brushtools.canvas.dispatchEvent(new PointerEvent("pointermove", up));
        brushtools.canvas.dispatchEvent(new PointerEvent("pointerup", up));
    },
    currentDown: false,
    canvas: null,
    getColorsHue: () => [...QSA("#game-toolbar > div.picker > div.color-picker > div.colors:not([style*=none]) > div > div > div")]
        .map(col => new Color({ rgb: col.style.backgroundColor }))
        .map(col => [col.hsl[0], col.hsl[2], col])
        .sort((a, b) => a[0] - b[0]),
    getColorsWeighted: () => [...QSA("#game-toolbar > div.picker > div.color-picker > div.colors:not([style*=none]) > div > div > div")]
        .map(col => new Color({ rgb: col.style.backgroundColor }))
        .map(col => [Math.sqrt(0.5 * col.hsl[0] * col.hsl[0] + 0.5 * col.hsl[1] * col.hsl[1] + col.hsl[2] * col.hsl[2]), col])
        .sort((a, b) => a[0] - b[0]),
    colorGroups: [
        ['rgb(255, 255, 255)', 'rgb(210, 210, 210)', 'rgb(168, 168, 168)', 'rgb(126, 126, 126)', 'rgb(80, 80, 80)', 'rgb(0, 0, 0)'],
        ['rgb(239, 19, 11)', 'rgb(183, 6, 0)', 'rgb(86, 8, 6)'],
        ['rgb(255, 113, 0)', 'rgb(206, 67, 12)', 'rgb(137, 39, 0)'],
        ['rgb(255, 228, 0)', 'rgb(232, 162, 0)', 'rgb(163, 103, 0)'],
        ['rgb(0, 255, 145)', 'rgb(0, 158, 114)', 'rgb(0, 120, 93)', 'rgb(0, 204, 0)', 'rgb(0, 114, 21)', 'rgb(0, 61, 3)'],
        ['rgb(0, 178, 255)', 'rgb(0, 86, 158)', 'rgb(0, 59, 120)', 'rgb(35, 31, 211)', 'rgb(18, 11, 145)', 'rgb(8, 3, 82)'],
        ['rgb(211, 124, 170)', 'rgb(167, 85, 116)', 'rgb(118, 48, 75)', 'rgb(163, 0, 186)', 'rgb(108, 0, 135)', 'rgb(65, 0, 81)'],
        ['rgb(255, 172, 142)', 'rgb(226, 139, 93)', 'rgb(204, 119, 77)', 'rgb(160, 82, 45)', 'rgb(99, 48, 13)', 'rgb(72, 28, 0)']
    ],
    enable: (modename, state) => {
        for (let [name, group] of Object.entries(brushtools.groups)) {
            for (let [name, mode] of Object.entries(group)) {
                if (mode.name == modename) {
                    if (state) mode.enable();
                    else mode.disable();
				}
            }
        }
    },
    modal: null,
    showSettings: null,
    setup: () => {
        brushtools.canvas = QS("#game-canvas canvas");
        brushtools.canvas.addEventListener("pointerdown", (event) => {
            if(!event.isTrusted) return;
            brushtools.currentDown = true;
            for (let [name, group] of Object.entries(brushtools.groups)) {
                for (let [name, mode] of Object.entries(group)) {
                    if (mode.enabled) mode.pointermoveCallback(event);
                }
            }
        });
        brushtools.canvas.addEventListener("pointerup", (event) => {
            if(!event.isTrusted) return;
            brushtools.currentDown = false;
        });
        brushtools.canvas.addEventListener("pointermove", (event) => {
            if(!event.isTrusted) return;
            for (let [name, group] of Object.entries(brushtools.groups)){
                for (let [name, mode] of Object.entries(group)) {
                    if (mode.enabled) mode.pointermoveCallback(event);
                }
            }
        });

        const settingsContent = elemFromString(`<div id="brushmagicSettings" style="
                display: grid;
                grid-column-gap:2em;
                width: 100%;
                grid-template-columns: 1fr 1fr 1fr;"></div>`);

        const updateStates = () => {
            for (let [name, group] of Object.entries(brushtools.groups)) {
                for (let [name, mode] of Object.entries(group)) {
                    const toggle = settingsContent.querySelector("input#brushmagicToggle" + name);
                    if (toggle) toggle.checked = mode.enabled;
                }
            }
        }

        for (let [name, group] of Object.entries(brushtools.groups)) {
            const groupContainer = elemFromString(`<div><h3>Adjust ${name}:</h3></div>`);
            for (let [name, mode] of Object.entries(group)) {
                const modeDetails = elemFromString(`<div class="mode">
                <label>
                    <input id="brushmagicToggle${name}" type="checkbox" class="flatUI"></input>
                    <span>${mode.name}</span>
                </label>
                <span style="font-style:italic">${mode.description}</span>
                </div>`);
                modeDetails.querySelector("input").addEventListener("input", (event) => {
                    if (event.target.checked) mode.enable();
                    else mode.disable();
                    updateStates();
                });
                const modeOptions = elemFromString(`<div class="options"></div>`);
                for (let [name, option] of Object.entries(mode.options)) {
                    if (option.type == "num") {
                        const optionElem = elemFromString(`<label>Set ${name}:<input type="number" value="${option.val}"></label>`);
                        modeOptions.appendChild(optionElem);
                        optionElem.querySelector("input").addEventListener("input", event => {
                            option.val = parseInt(event.target.value);
                            if(option.save) option.save(option.val);
                        });
                    }
                    else if (typeof (option) == "object") {
                        const optionElem = elemFromString(`<label>Set ${name}:<select value="${option.val}">${option.type.map(opt => "<option value="+opt+" " + (option.val == opt ? "selected" : "") + ">" + opt + "</option>").join("")}</select></label>`);
                        modeOptions.appendChild(optionElem);
                        optionElem.querySelector("select").addEventListener("input", event => {
                            option.val = event.target.value;
                            if(option.save) option.save(option.val);
                        });
					}

                }
                modeDetails.appendChild(modeOptions);
                groupContainer.appendChild(modeDetails);
            }
            settingsContent.appendChild(groupContainer);
        }

        brushtools.showSettings = () => {
            updateStates();
            if (!brushtools.modal) brushtools.modal = new Modal(settingsContent, () => { brushtools.modal = null; }, "Brush Laboratory");
            else {
                brushtools.modal.close();
                brushtools.modal = null;
            }
        }

        document.addEventListener("openBrushLab", brushtools.showSettings);
    }
};
