import "./style.css"
import p5 from "p5"
import { addUI } from "./library/ui"
import sketch from "./sketches/test"

new p5(addUI(sketch), document.getElementById("app") ?? undefined)
