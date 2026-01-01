import "./style.css"
import p5 from "p5"
import { addUI } from "./library/ui"
import sketch from "./sketches/2026/1shape1color"

new p5(addUI(sketch), document.getElementById("app") ?? undefined)
