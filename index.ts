import "./style.css";
import p5 from "p5";
import sketch from "./sketches/test";

new p5(sketch, document.getElementById("app") ?? undefined);
