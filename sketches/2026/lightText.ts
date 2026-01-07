import GUI from "lil-gui"
import type p5 from "p5"

type SegmentDisplay = [
	boolean, // top
	boolean, // top left
	boolean, // top right
	boolean, // middle
	boolean, // bottom left
	boolean, // bottom right
	boolean, // bottom
]

const G: SegmentDisplay = [true, true, false, false, true, true, true]
const E: SegmentDisplay = [true, true, false, true, true, false, true]
const N: SegmentDisplay = [true, true, true, false, true, true, false]
const U: SegmentDisplay = [false, true, true, false, true, true, true]
const A: SegmentDisplay = [true, true, true, true, true, true, false]
const R: SegmentDisplay = [true, true, true, true, true, false, true]
const Y: SegmentDisplay = [false, true, true, true, false, true, true]

//const turnOn = () => [true, true, true, true, true, true, true] as SegmentDisplay
const turnOff = () => [false, false, false, false, false, false, false] as SegmentDisplay
const text = [G, E, N, U, A, R, Y]

type Light = {
	distance: number
	speed: number
	lissajousFrequencyRatio: number
	lissajousAmplitudeRatio: number
	lissajousPhase: number
	concentration: number
	color: p5.Color
}

export default (p: p5) => {
	const config = {
		color: "green",
		segmentWidth: 0.25,
		segmentCornerHeight: 0.15,
		segmentScaleFactor: 0.9,
		letterScaleFactor: 0.7,
		debugMode: false,
		lightConcentration: 100,
		numDisplayRows: 13,
		numLights: 4,
		displayAnimationTime: 100,
	}

	let segment: p5.Geometry
	let lights: Light[]
	let grid: SegmentDisplay[][]

	let prevDisplayAnimationTime = 0

	p.keyTyped = () => {
		if (p.key === "a") {
			p.startRecording()
		} else if (p.key === "s") {
			p.stopRecording()
		}
		if (p.key === " ") {
			p.isLooping() ? p.noLoop() : p.loop()
		}
	}

	p.setup = () => {
		const canvas = p.createCanvas(1000, 1000, p.WEBGL)

		const gui = new GUI()
		gui.addColor(config, "color")
		gui.add(config, "debugMode")
		gui.add(config, "segmentScaleFactor", 0.8, 1)
		gui.add(config, "letterScaleFactor", 0, 1)
		gui.add(config, "segmentWidth", 0.1, 0.5).onChange(() => {
			segment = p.buildGeometry(initSegment)
		})
		gui.add(config, "segmentCornerHeight", 0.1, 0.5).onChange(() => {
			segment = p.buildGeometry(initSegment)
		})
		gui.add(config, "numDisplayRows", 1, 15, 1).onChange(() => {
			initGrid()
		})

		segment = p.buildGeometry(initSegment)
		initLights()
		initGrid()

		for (let i = 0; i < config.numLights; i++) {
			const lightFolder = gui.addFolder(`Light ${i + 1}`).open()
			lightFolder.add(lights[i], "concentration", 50, 250, 1)
			lightFolder.add(lights[i], "speed", 0.5, 2, 0.1)
		}
		canvas.mouseClicked(() => {
			initLights()
			//initGrid()
		})
	}
	p.draw = () => {
		p.background(15)

		p.push()
		p.noStroke()
		p.scale(p.height / (config.numDisplayRows * 2))

		const t = p.frameCount / 30
		for (let i = 0; i < lights.length; i++) {
			const light = lights[i]
			if (i === 0) {
				p.spotLight(light.color, 0, 0, 1000, 0, 0, -1, p.PI / 3, light.concentration)
				continue
			}
			const tLight = t * light.speed
			const x =
				0.4 * light.lissajousAmplitudeRatio * Math.sin(light.lissajousFrequencyRatio * tLight + light.lissajousPhase)
			const y = 0.4 * Math.sin(tLight)
			p.spotLight(light.color, 0, 0, 1000, x, y, -1, p.PI / 3, light.concentration)
		}
		p.specularMaterial(config.color)

		const currentMillis = p.millis()
		const noiseFactor = 0.3
		if (currentMillis - prevDisplayAnimationTime > config.displayAnimationTime) {
			for (let row = 0; row < config.numDisplayRows; row++) {
				for (let col = 0; col < grid[row].length; col++) {
					const numColumns = grid[row].length
					const colWord = col - Math.floor(numColumns / 2) + Math.floor(text.length / 2) + 1
					if (row === Math.floor(config.numDisplayRows / 2) && colWord >= 0 && colWord < text.length) {
						grid[row][col] = text[Math.floor(colWord)]
					} else {
						const n = p.noise(row * noiseFactor, col * noiseFactor, currentMillis / 1000)
						grid[row][col] = n > 0.5 ? randomDisplay() : turnOff()
					}
				}
			}
			prevDisplayAnimationTime = currentMillis
		}

		p.translate(0, -config.numDisplayRows + 1)
		for (let row = 0; row < config.numDisplayRows; row++) {
			p.push()
			p.translate((1 - (row % 2)) / 2, row * 2)
			drawWord(grid[row])
			p.pop()
		}

		p.filter(p.BLUR, 2)
		p.pop()
	}

	function initLights() {
		lights = []
		const frequencyRatios = [1 / 3, 2 / 3, 3 / 4, 3 / 5, 4 / 5, 5 / 6]
		for (let i = 0; i < config.numLights; i++) {
			const concentration = i === 0 ? 50 : p.random(200, 300)
			const frequencyRatiosIndex = p.floor(p.random(frequencyRatios.length))
			const lissajousFrequencyRatio = frequencyRatios[frequencyRatiosIndex]
			frequencyRatios.splice(frequencyRatiosIndex, 1)
			const lissajousAmplitudeRatio = p.width / p.height
			const lissajousPhase = p.random([0, p.PI])
			const color = i === 0 ? p.color(config.color) : p.color(p.random(200, 255))
			lights.push({
				distance: 1000,
				lissajousFrequencyRatio,
				lissajousAmplitudeRatio,
				lissajousPhase,
				concentration,
				speed: p.random(0.5, 1.5),
				color: color,
			})
		}
	}

	function initGrid() {
		const numDisplayColumns = config.numDisplayRows * 2
		grid = []
		for (let i = 0; i < config.numDisplayRows; i++) {
			grid.push([])
			for (let j = 0; j < numDisplayColumns; j++) {
				grid[i].push(randomDisplay())
			}
		}
	}

	function drawWord(word: SegmentDisplay[]) {
		for (let i = 0; i < word.length; i++) {
			p.push()
			const x = i + 0.5 - word.length / 2
			p.translate(x, 0)
			p.scale(config.letterScaleFactor, config.letterScaleFactor + 0.1)
			drawSegments(word[i])
			p.pop()
		}
	}

	function drawSegments(display: SegmentDisplay) {
		for (let i = 0; i < display.length; i++) {
			p.push()
			const y = Math.floor(i / 3) - 1
			const x = i % 3 === 2 ? 0.5 : -0.5
			const rotation = i % 3 === 0 ? -p.HALF_PI : 0
			p.translate(x, y)
			if (display[i]) {
				p.push()
				p.rotate(rotation)
				p.translate(0, (1 - config.segmentScaleFactor) * 0.5)
				p.scale(config.segmentScaleFactor)
				p.model(segment)
				p.pop()
			}
			if (config.debugMode) {
				p.fill("red")
				p.circle(0, 0, 0.2)
			}
			p.pop()
		}
	}

	function initSegment() {
		p.triangle(
			0,
			0,
			config.segmentWidth / 2,
			config.segmentCornerHeight,
			-config.segmentWidth / 2,
			config.segmentCornerHeight,
		)
		p.rect(
			-config.segmentWidth / 2,
			config.segmentCornerHeight,
			config.segmentWidth,
			1 - config.segmentCornerHeight * 2,
		)
		p.triangle(
			0,
			1,
			config.segmentWidth / 2,
			1 - config.segmentCornerHeight,
			-config.segmentWidth / 2,
			1 - config.segmentCornerHeight,
		)
	}

	function randomDisplay(): SegmentDisplay {
		return [
			p.random() >= 0.5,
			p.random() >= 0.5,
			p.random() >= 0.5,
			p.random() >= 0.5,
			p.random() >= 0.5,
			p.random() >= 0.5,
			p.random() >= 0.5,
		]
	}
}
