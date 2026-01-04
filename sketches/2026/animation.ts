import GUI from "lil-gui"
import type p5 from "p5"

interface Box {
	size: p5.Vector
	startPosition: p5.Vector
	position: p5.Vector
	velocity: p5.Vector
	scale: p5.Vector
	startOffset: number // in seconds
	color: p5.Color
}

export default (p: p5) => {
	const config = {
		debugMode: false,
		fieldOfView: 90,
		animationTime: 6, // seconds
		cameraRadius: 1,
		cameraPolarAngle: 0,
		cameraAzimuthalAngle: 90,
		shininess: 10,
		metalness: 50,
		concentration: 10,
	}

	const goldenRatio = (1 + Math.sqrt(5)) / 2
	const b = Math.log(goldenRatio) / p.HALF_PI
	const initialRadius = 1 / Math.exp(b * p.TWO_PI)

	let boxes: Box[]
	let prevT = -1

	p.setup = () => {
		const canvas = p.createCanvas(1000, 1000, p.WEBGL)
		p.angleMode(p.DEGREES)
		p.colorMode(p.HSL)

		const gui = new GUI()
		gui.add(config, "debugMode")
		gui.add(config, "fieldOfView", 30, 120, 1)
		gui.add(config, "animationTime", 1, 10, 0.1)
		gui.add(config, "cameraRadius", 0.1, 2, 0.1)
		gui.add(config, "cameraPolarAngle", 0, 85, 1)
		gui.add(config, "cameraAzimuthalAngle", 0, 360, 1)
		gui.add(config, "shininess", 1, 100, 1)
		gui.add(config, "metalness", 1, 100, 1)
		gui.add(config, "concentration", 1, 1000, 1)
		gui.close()

		init()
		canvas.mouseClicked(() => init())
	}

	p.keyTyped = () => {
		if (p.key === "a") {
			p.startRecording()
		} else if (p.key === "s") {
			p.stopRecording()
		}
	}

	p.draw = () => {
		p.background(0, 0, 20)

		const seconds = p.millis() / 1000
		const cycleNumber = Math.floor(seconds / config.animationTime)
		const t = (seconds % config.animationTime) / config.animationTime
		const isSwitchCycle = t < prevT || prevT === -1
		prevT = t
		if (isSwitchCycle) {
			init()
			config.cameraAzimuthalAngle = p.random(0, 360)
			config.cameraPolarAngle = p.random(-10, 10)
			config.cameraRadius = p.random(1, 1.2)
		}

		p.push()
		const cameraX = config.cameraRadius * p.sin(config.cameraPolarAngle) * p.cos(config.cameraAzimuthalAngle)
		const cameraY = config.cameraRadius * p.sin(config.cameraPolarAngle) * p.sin(config.cameraAzimuthalAngle)
		const cameraZ = config.cameraRadius * p.cos(config.cameraPolarAngle)
		const upVector =
			config.cameraPolarAngle === 0
				? p.createVector(1, 0, 0).rotate(config.cameraAzimuthalAngle)
				: p.createVector(0, 0, -1)
		p.camera(cameraX, cameraY, cameraZ, 0, 0, 0, upVector.x, upVector.y, upVector.z)
		p.perspective(config.fieldOfView, p.width / p.height, 0.01, 10)
		p.ambientLight("white")
		p.directionalLight(p.color("white"), -1, 1, -1)
		p.directionalLight(p.color("white"), 1, -1, -1)

		p.strokeWeight(0.002)
		p.scale(2)
		p.translate(-1, -0.5, 0)
		for (const [index, box] of boxes.entries()) {
			const tBox = p.constrain(t - box.startOffset, 0, 1)
			const x = ease(fract(tBox * 2)) + Math.floor(tBox * 2)
			const prevPosition = box.position
			const prevVelocity = box.velocity
			const nextPosition = p.createVector(x, box.position.y)
			const nextVelocity = nextPosition.copy().sub(prevPosition).div(p.deltaTime).mult(100)
			const acceleration = nextVelocity.copy().sub(prevVelocity).div(p.deltaTime).mult(100)
			box.velocity = nextVelocity
			box.position = nextPosition
			box.scale.add(acceleration.x, -acceleration.x)
			const n = p.noise(index / 10, cycleNumber * 10)
			const xOffset = tBox === 0 ? -2 : p.map(n, 0, 1, -0.3, 0.3)
			p.push()
			p.translate(xOffset, 0)
			p.translate(x, box.startPosition.y)
			p.scale(Math.min(box.scale.x, 1.2), Math.max(box.scale.y, 0.8))

			p.fill(box.color)
			p.noStroke()
			p.specularMaterial(box.color)
			p.shininess(config.shininess)
			p.metalness(config.metalness)
			p.box(box.size.x, box.size.y, box.size.z)
			p.pop()
		}
		p.pop()
	}

	function fract(x: number) {
		return x - Math.floor(x)
	}

	function ease(x: number) {
		const c5 = (2 * Math.PI) / 4.5
		return x === 0
			? 0
			: x === 1
				? 1
				: x < 0.5
					? -(2 ** (20 * x - 10) * Math.sin((20 * x - 11.125) * c5)) / 2
					: (2 ** (-20 * x + 10) * Math.sin((20 * x - 11.125) * c5)) / 2 + 1
	}

	function init() {
		boxes = []
		const randomRadius = p.random(0.02, 0.07)
		const points = poissonDiscSampling(randomRadius, 30).sort((a, b) => a - b)
		const fixSaturation = p.random([true, false])
		const randomHueRotation = p.random(p.TWO_PI)
		const randomFixedAxis = p.random(20, 80)
		for (let i = 1; i < points.length; i++) {
			const midpoint = (points[i] + points[i - 1]) / 2
			const size = points[i] - points[i - 1]

			const angleSpiral = p.random(p.TWO_PI)
			const angleHue = (((angleSpiral + randomHueRotation) % p.TWO_PI) / p.TWO_PI) * 360
			const radius = initialRadius * Math.exp(b * angleSpiral)
			const radiusAxis = p.map(radius, 0, 1, 20, 80)
			const color = fixSaturation
				? p.color(angleHue, randomFixedAxis, radiusAxis)
				: p.color(angleHue, radiusAxis, randomFixedAxis)
			boxes.push({
				startPosition: p.createVector(0, midpoint),
				size: p.createVector(size * p.random(0.5, 1.5), size, size * p.random(0.5, 1.5)),
				position: p.createVector(0, midpoint),
				scale: p.createVector(1, 1),
				velocity: p.createVector(0, 0),
				startOffset: p.random(0, 0.2),
				color,
			})
		}
	}

	// https://sighack.com/post/poisson-disk-sampling-bridsons-algorithm
	function poissonDiscSampling(radius: number, k = 30) {
		const N = 1 // number of dimensions
		const points: number[] = []
		const active: number[] = []

		// Step 0
		const grid: (number | null)[] = []
		const cellSize = radius / Math.sqrt(N)
		const nCells = Math.ceil(1 / cellSize) + 1

		for (let i = 0; i < nCells; i++) {
			grid[i] = null
		}

		function insertPoint(point: number) {
			const index = Math.floor(point / cellSize)
			grid[index] = point
		}

		insertPoint(0)
		points.push(0)
		insertPoint(1)
		points.push(1)

		// Step 1
		const p0 = p.random()
		insertPoint(p0)
		points.push(p0)
		active.push(p0)

		// Step 2
		function isValidPoint(point: number) {
			if (point < 0 || point >= 1) return false

			const index = Math.floor(point / cellSize)
			const i0 = Math.max(index - 1, 0)
			const i1 = Math.min(index + 1, nCells - 1)
			for (let i = i0; i <= i1; i++) {
				const gridPoint = grid[i]
				if (gridPoint !== null) {
					const d = Math.abs(gridPoint - point)
					if (d < radius) return false
				}
			}
			return true
		}

		while (active.length > 0) {
			const randomPoint = p.random(active)
			const randomIndex = active.indexOf(randomPoint)

			let found = false
			for (let tries = 0; tries < k; tries++) {
				const newPoint = randomPoint + p.random(radius, radius * 2) * p.random([-1, 1])

				if (!isValidPoint(newPoint)) continue

				points.push(newPoint)
				insertPoint(newPoint)
				active.push(newPoint)
				found = true
				break
			}

			if (!found) active.splice(randomIndex, 1)
		}

		return points
	}
}
