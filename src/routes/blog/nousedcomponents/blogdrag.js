import Scene from "./Scene";
import * as PIXI from "pixi.js";
import { curvyCircle, curvyRect } from "@/helpers/Drawing";
import { clamp, randomIntInRange } from "@/helpers/MathUtils";
import ResizeService from "@/services/ResizeService";
import anime from "animejs";
import Lerp from "@/helpers/Lerp";
import Touch from "../helpers/Touch";
import ForceLandscape from "../helpers/ForceLandscape";
import router from "@/router";
import PixiService from "@/services/PixiService";
import { ColorOverlayFilter } from "../filters/ColorOverlayFilter";
import Color from "color";
import manifest from "../manifests/SelectCards";
import Sounds from "@/services/PixiService/Sounds";

const STATES = {
    INTRO: "intro",
    MAIN: "main",
    SELECTED: "selected",
    CHOSEN: "chosen",
};

class Home extends Scene {
    items = [];
    _current = 0; // starting at 0
    _previous = -1;
    _state = STATES.INTRO;

    // carousel card order
    cards = ["waipoua", "anp", "cuba-st", "the-coast", "rotorua"];

    constructor() {
        let assets = [
            {
                id: "drag",
                url: require("@/assets/img/select/drag.png"),
            },
        ];

        // add card layer assets
        manifest.forEach((m) => {
            m.layers.forEach((l) => {
                if (!l.url) return;
                // make a copy to rename the layer ID to be more specific
                let layer = Object.assign({}, l);
                layer.id = `${m.id}-${l.id}`;
                assets.push(layer);
            });
        });

        super(assets);
    }

    get current() {
        return this._current;
    }

    set current(val) {
        if (this._current !== val) {
            this.previous = this._current;
            this._current = val;
            this.currentUpdated();

            // play sound
            Sounds.card_swipe.play(true);
        }
    }

    get previous() {
        return this._previous;
    }

    set previous(val) {
        this._previous = val;
    }

    get activeCard() {
        return this.items[this.current];
    }

    get state() {
        return this._state;
    }

    set state(val) {
        this._state = val;

        // buttons
        let selected = val === STATES.SELECTED;
        this.timed.interactive = selected;
        this.casual.interactive = selected;

        if (selected) {
            this.animateButtons();
            Sounds.select_mode.play(true);
        }

        if (val === STATES.CHOSEN) {
            Sounds.mode_chosen.play(true);
        }
    }

    findCard = (id) => {
        return manifest.filter((m) => {
            return m.id === id;
        })[0];
    };

    setup() {
        this.touch = new Touch(this.stage);
        this.touch.on(this.touch.Events.END, this.snap);

        this.createTouchBase();
        this.createButtons();
        this.createCarousel();
        this.createDragInstruction();
    }

    shown() {
        this.state = STATES.INTRO;
        setTimeout(() => {
            this.state = STATES.MAIN;
        }, 500);

        // random card rotation
        this.items.forEach((card) => {
            card.pos.r.to = randomIntInRange(1, 10) - 5;
            card.pos.r.set();
        });

        this.currentUpdated();
    }

    enter() {
        super.enter();

        Sounds.intro_bgm.play();
        Sounds.intro_bgm.fade(1, 1000);

        // show drag instruction animation
        this.draggerTimeline.restart();
    }

    leave() {
        super.leave();

        Sounds.intro_bgm.fade(0, 1000);
        setTimeout(() => {
            Sounds.intro_bgm.pause();
        }, 1100);
    }

    createTouchBase() {
        let base = new PIXI.Graphics();
        base.beginFill(0xffffff);
        base.drawRect(0, 0, ForceLandscape.width, ForceLandscape.height);
        base.endFill();
        base.filters = [new ColorOverlayFilter(0xe6754b)];
        base.bgColor = "#e6754b";
        this.stage.addChild(base);
        this.touchBase = base;
    }

    redrawTouchBase() {
        let base = this.touchBase;
        base.clear();
        base.beginFill(0xffffff);
        base.drawRect(0, 0, ForceLandscape.width, ForceLandscape.height);
        base.endFill();
    }

    animateBgColor(color = "#e6754b", duration = 1000, easing = "easeOutExpo") {
        anime.remove([this.touchBase]);
        anime({
            targets: [this.touchBase],
            bgColor: [color],
            duration,
            easing,
            update: () => {
                this.touchBase.filters[0].color = Color(
                    this.touchBase.bgColor
                ).rgbNumber();
            },
        });
    }

    createCarousel() {
        // settings
        let specs = {
            width: 515,
            height: 283,
            border: 14,
        };

        for (let x = 0; x < this.cards.length; x++) {
            let c = this.cards[x];
            let ref = this.findCard(c);
            let card = {
                base: new PIXI.Container(),
                pos: {
                    x: new Lerp({ ease: 0.12 - x * 0.01 }),
                    y: new Lerp({ ease: 0.12 - x * 0.01 }),
                    r: new Lerp({ ease: 0.12 - x * 0.01 }),
                },
                ref,
                layers: {},
                animations: {},
                index: x,
            };

            let border = new PIXI.Graphics();
            border.beginFill(0xe5e5da);
            border.drawRoundedRect(0, 0, specs.width, specs.height, 5);
            border.endFill();
            card.base.addChild(border);

            let bg = new PIXI.Graphics();
            bg.beginFill(ref.bg);
            bg.drawRoundedRect(
                specs.border,
                specs.border,
                specs.width - specs.border * 2,
                specs.height - specs.border * 2,
                5
            );
            bg.endFill();
            card.base.addChild(bg);

            let bgMask = new PIXI.Graphics();
            bgMask.beginFill(0x000000);
            bgMask.drawRoundedRect(
                specs.border,
                specs.border,
                specs.width - specs.border * 2,
                specs.height - specs.border * 2,
                5
            );
            bgMask.endFill();
            card.base.addChild(bgMask);
            // bg.mask = bgMask

            // card layers
            let layers = new PIXI.Container();
            ref.layers.forEach((l) => {
                let s;

                // image
                if (l.url) {
                    s = new PIXI.Sprite(
                        this.loader.resources[`${ref.id}-${l.id}`].texture
                    );
                    if (l.anchor) {
                        s.anchor = l.anchor;
                    }
                }

                // text
                if (l.text) s = new PIXI.Text(l.text, l.style);

                // placement
                s.scale.x = s.scale.y = 0.5;
                if (l.x) s.x = l.x * 0.5;
                if (l.y) s.y = l.y * 0.5;

                // if sprite and anchored to centre, add half of dimensions
                if (l.url && l.anchor) {
                    s.x += s.width * l.anchor.x;
                    s.y += s.height * l.anchor.y;
                }

                layers.addChild(s);
                card.layers[l.id] = s;

                if (l.id === "char" && ref.id === "the-coast") window.char = s;
            });

            if (ref.animations) {
                // card animations
                let anim = ref.animations;
                Object.keys(ref.animations).forEach((type) => {
                    let timeline = anime.timeline({ autoplay: false });
                    anim[type].forEach((i) => {
                        // convert targets
                        let ti = Object.assign({}, i);
                        let ts = [];
                        ti.targets.forEach((t) => {
                            let s = t.split(":");
                            if (typeof card.layers[s[0]] === "object") {
                                let obj = card.layers[s[0]];
                                if (s.length === 1) {
                                    // this is the target
                                    ts.push(obj);
                                } else {
                                    // deeper target
                                    let to = 1;
                                    let toObj = obj;
                                    while (
                                        to &&
                                        typeof obj[s[to]] === "object"
                                    ) {
                                        toObj = obj[s[to]];
                                        to = to < s.length - 1 ? to + 1 : null;
                                    }
                                    ts.push(toObj);
                                }
                            }
                        });
                        // grab offset
                        // let offset = typeof ti.offset === 'number' ? parseFloat(ti.offset) : null
                        // delete ti.offset
                        ti.targets = ts;
                        // add to timeline
                        timeline.add(ti);
                    });
                    // add to card
                    card.animations[type] = timeline;
                });
            }

            card.base.addChild(layers);
            layers.mask = bgMask;
            card.image = layers;

            card.base.pivot.x = card.base.width / 2;
            card.base.pivot.y = card.base.height / 2;
            card.base.interactive = true;
            card.base.on("click", this.onCardClick);
            card.base.on("tap", this.onCardClick);

            this.stage.addChild(card.base);
            card.base.data = card;
            this.items.push(card);
        }
    }

    createButtons() {
        // grab these resources from the entry loader
        let loader = PixiService.getScene("loader").loader;

        this.casual = new PIXI.Sprite(loader.resources[`btn-casual`].texture);
        this.casual.anchor.x = this.casual.anchor.y = 0.5;
        this.casual.scale.x = this.casual.scale.y = 0.5;
        this.casual.interactive = true;
        this.casual.cursor = "pointer";
        this.casual.alphaTo = new Lerp({ ease: 0.25 });
        this.casual.on("click", this.onCasual);
        this.casual.on("tap", this.onCasual);

        this.timed = new PIXI.Sprite(loader.resources[`btn-timed`].texture);
        this.timed.anchor.x = this.timed.anchor.y = 0.5;
        this.timed.scale.x = this.timed.scale.y = 0.5;
        this.timed.interactive = true;
        this.timed.cursor = "pointer";
        this.timed.alphaTo = new Lerp({ ease: 0.25 });
        this.timed.on("click", this.onTimed);
        this.timed.on("tap", this.onTimed);

        this.stage.addChild(this.casual);
        this.stage.addChild(this.timed);
    }

    animateButtons() {
        anime.remove([
            this.casual,
            this.casual.scale,
            this.timed,
            this.timed.scale,
        ]);

        anime({
            targets: this.casual,
            angle: [-20, 0],
        });
        anime({
            targets: this.casual.scale,
            x: [0.65, 0.5],
            y: [0.65, 0.5],
        });
        anime({
            targets: this.timed,
            angle: [20, 0],
        });
        anime({
            targets: this.timed.scale,
            x: [0.65, 0.5],
            y: [0.65, 0.5],
        });
    }

    createDragInstruction() {
        this.dragInstruction = new PIXI.Container();

        this.dragBase = new PIXI.Graphics();
        this.dragBase.alpha = 0.75;
        this.dragInstruction.addChild(this.dragBase);

        this.dragger = new PIXI.Sprite(this.loader.resources["drag"].texture);
        this.dragger.anchor.set(0.5, 0.5);
        this.dragger.xAnimate = 0;
        this.dragger.yAnimate = 0;
        this.dragInstruction.addChild(this.dragger);

        // animate hand
        this.draggerTimeline = new anime.timeline({
            autoplay: false,
            loop: 2,
            complete: this.draggerDone,
        });
        this.draggerTimeline.add({
            targets: this.dragger,
            xAnimate: [0, 100],
            angle: [0, 5],
            easing: "easeInOutQuart",
            duration: 500,
            offset: 0,
        });
        this.draggerTimeline.add({
            targets: this.dragger,
            xAnimate: [100, -100],
            angle: [5, -5],
            easing: "easeInOutQuart",
            duration: 500,
            offset: 500,
        });
        this.draggerTimeline.add({
            targets: this.dragger,
            xAnimate: [-100, 0],
            angle: [-5, 0],
            easing: "easeInOutQuart",
            duration: 500,
            offset: 1000,
        });
        this.draggerTimeline.add({
            targets: this.dragger,
            xAnimate: [0],
            easing: "linear",
            duration: 500,
            offset: 1500,
        });

        this.stage.addChild(this.dragInstruction);
    }

    redrawDragBase() {
        let base = this.dragBase;
        base.clear();
        base.beginFill(0x000000);
        base.drawRect(0, 0, ForceLandscape.width, ForceLandscape.height);
        base.endFill();
    }

    draggerDone = () => {
        anime({
            targets: this.dragInstruction,
            alpha: [1, 0],
            duration: 500,
            easing: "easeOutQuart",
            complete: () => {
                this.dragInstruction.visible = false;
            },
        });
    };

    onCardClick = (e) => {
        if (!this.touch.canClick) return;

        // update current?
        let card = e.currentTarget.data;
        if (card.index !== this.current) {
            this.current = card.index;
        }

        this.state =
            this.state === STATES.SELECTED ? STATES.MAIN : STATES.SELECTED;
    };

    onCasual = (e) => {
        if (!this.touch.canClick) return;

        this.state = STATES.CHOSEN;
        router.push(`/play/${this.current + 1}/casual`);
    };

    onTimed = (e) => {
        if (!this.touch.canClick) return;

        this.state = STATES.CHOSEN;
        router.push(`/play/${this.current + 1}/timed`);
    };

    resize() {
        // redraw touch base
        this.redrawTouchBase();

        this.redrawDragBase();
        this.dragInstruction.x = this.dragInstruction.y = 0;
        let upscale = clamp(ForceLandscape.width / 1024, 1, 1.5);
        this.dragger.scale.x = this.dragger.scale.y = upscale * 0.5;
    }

    update() {
        // update cards
        let upscale = clamp(ForceLandscape.width / 1024, 1, 1.5);
        let card;
        for (let x = 0; x < this.items.length; x++) {
            card = this.items[x];
            card.pos.x.process();
            card.pos.y.process();
            card.pos.r.process();

            let left = ForceLandscape.width / 2;
            let top = ForceLandscape.height / 2;
            let gap = 50 * upscale;
            card.base.scale.x = card.base.scale.y = upscale;
            let w = card.base.width + gap;
            let percFromCenter = (x - this.current) / (this.items.length / 2);

            switch (this.state) {
                case STATES.INTRO:
                    card.pos.x.to = card.pos.x.current = left;
                    card.pos.y.to = card.pos.y.current = top;
                    break;

                case STATES.MAIN:
                case STATES.SELECTED:
                case STATES.CHOSEN:
                    card.pos.x.to =
                        left + w * x - w * this.current - this.touch.x;
                    card.pos.y.to =
                        top +
                        Math.abs(percFromCenter) * (card.base.height * 0.75);
                    card.pos.r.to = percFromCenter * 30;

                    if (this.state === STATES.SELECTED && x === this.current) {
                        card.pos.y.to -= card.base.height * 0.4;
                        card.pos.r.to += 2;
                    }

                    if (this.state === STATES.CHOSEN && x === this.current) {
                        card.pos.y.to -= card.base.height;
                    }
                    break;
            }

            card.base.x = card.pos.x.current;
            card.base.y = card.pos.y.current;
            card.base.angle = card.pos.r.current;

            card.base.visible = !(
                card.base.x > ForceLandscape.width + w / 2 ||
                card.base.x < -(w / 2)
            );
        }

        // buttons
        let alpha = this.state === STATES.SELECTED ? 1 : 0;
        this.casual.alphaTo.process();
        this.casual.alphaTo.to = alpha;
        this.casual.alpha = this.casual.alphaTo.current;
        this.timed.alphaTo.process();
        this.timed.alphaTo.to = alpha;
        this.timed.alpha = this.timed.alphaTo.current;

        // button position
        let bupscale = clamp(ForceLandscape.width / 1024, 1, 1.5) * 0.5;
        let bleft = ForceLandscape.width / 2;
        let btop = ForceLandscape.height / 2 + card.base.height * 0.38;
        this.timed.scale.x = this.timed.scale.y = bupscale;
        this.casual.scale.x = this.casual.scale.y = bupscale;
        this.timed.x = bleft - this.timed.width / 2 - 30;
        this.timed.y = btop;
        this.casual.x = bleft + this.casual.width / 2 + 30;
        this.casual.y = btop;

        // card swipe snap
        if (Math.abs(this.touch.x) > card.base.width * 0.15) {
            let d = this.touch.x < 0 ? -1 : 1;
            let c = this.current;
            this.current = clamp(this.current + d, 0, this.items.length - 1);
            this.touch.x = 0;
            this.touch.touchEnd();
        }

        // dragger
        this.dragger.x = ForceLandscape.width * 0.5 + this.dragger.xAnimate;
        this.dragger.y = ForceLandscape.height * 0.5 + this.dragger.yAnimate;
    }

    currentUpdated = (val) => {
        let current = this.activeCard;

        // always reset state
        this.state = STATES.MAIN;
        this.animateBgColor(current.ref.pageBg);

        // intro/outro animations?
        // current
        if (current.animations && current.animations.intro) {
            let ca = current.animations.intro;
            if (ca.reversed) ca.reverse();
            ca.restart();
        }

        // previous
        if (this.previous !== -1) {
            let previous = this.items[this.previous];
            if (previous.animations && previous.animations.intro) {
                let pa = previous.animations.intro;
                pa.reverse();
                pa.play();
            }
        }
    };

    snap = () => {
        this.touch.x = 0;
    };
}

export default new Home();
