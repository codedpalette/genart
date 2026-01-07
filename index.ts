import "./style.css"
import p5 from "p5"
import { p5Record } from "p5.record.js"
import { addUI } from "./library/ui"
import sketch from "./sketches/2026/lightText"

p5.registerAddon(p5Record)
new p5(addUI(sketch), document.getElementById("app") ?? undefined)
