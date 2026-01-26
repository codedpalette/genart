import GUI from "lil-gui"
import type p5 from "p5"

export default (p: p5) => {
  const config = {
    circleSize: 80,
    fillColor: "#FFFFFF",
    strokeColor: "#000000",
  }
  p.setup = () => {
    p.createCanvas(800, 800, p.WEBGL)
    p.background(220)

    const gui = new GUI()
    gui.add(config, "circleSize", 40, 120, 1)
    gui.addColor(config, "fillColor")
    gui.addColor(config, "strokeColor")
  }
  p.draw = () => {
    const mx = p.mouseX - p.width / 2
    const my = p.mouseY - p.height / 2
    if (p.mouseIsPressed) {
      p.fill(config.fillColor)
      p.stroke(config.strokeColor)
      p.circle(mx, my, config.circleSize)
    }
  }
}
