import type p5 from "p5"
import Stats from "stats-gl"
import type { Sketch } from "./types"

export function addStats(sketch: Sketch, node: HTMLElement = document.body): Sketch {
	return (p: p5) => {
		let stats: Stats

		sketch(p)
		const { setup, draw } = p

		p.setup = () => {
			setup()
			stats = new Stats({ trackGPU: true })
			stats.init(p.drawingContext)
			node.appendChild(stats.dom)
		}
		p.draw = () => {
			stats.begin()
			draw()
			stats.end()
			stats.update()
		}
	}
}
