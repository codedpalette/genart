import "./style.css"
import p5 from "p5"
import { addStats } from "./library/ui"
import sketch from "./sketches/test"

const sketchWithStats = addStats(sketch)
new p5(sketchWithStats, document.getElementById("app") ?? undefined)
