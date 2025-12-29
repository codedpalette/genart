import type p5 from "p5"

export default (p: p5) => {
	p.setup = () => {
		p.createCanvas(800, 800, p.WEBGL)
		p.pixelDensity(1)
		p.background(220)
	}
	p.draw = () => {
		const mx = p.mouseX - p.width / 2
		const my = p.mouseY - p.height / 2
		p.circle(mx, my, 80)
	}
}
