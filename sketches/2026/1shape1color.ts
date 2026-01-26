import type p5 from "p5"

export default (p: p5) => {
  const minDistanceBetweenPoints = 25
  const startingPoints: p5.Vector[] = []
  const widths: number[] = []
  const stepOffsets: number[] = []
  const rotationsZ: number[] = []
  const rotationsX: number[] = []
  const colors: p5.Color[] = []
  let horizontal: boolean

  let geometry: p5.Geometry

  p.setup = () => {
    const canvas = p.createCanvas(1000, 1000, p.WEBGL)
    p.angleMode(p.DEGREES)
    p.colorMode(p.HSL)

    initStacks(p.random(7, 12))
    canvas.mouseClicked(() => {
      startingPoints.splice(0, startingPoints.length)
      widths.splice(0, widths.length)
      stepOffsets.splice(0, stepOffsets.length)
      rotationsZ.splice(0, rotationsZ.length)
      rotationsX.splice(0, rotationsX.length)
      colors.splice(0, colors.length)
      initStacks(p.random(7, 12))
    })
  }

  function initGeometry() {
    const numVertices = p.random([3, 4, 5, 6, 7, 8])
    p.beginShape()
    for (let i = 0; i < numVertices; i++) {
      const angle = (p.TWO_PI / numVertices) * (i + 0.5)
      const x = Math.cos(angle)
      const y = Math.sin(angle)
      p.vertex(x, y)
    }
    p.endShape(p.CLOSE)
  }

  function initStacks(numStartingPoints: number) {
    geometry = p.buildGeometry(initGeometry)
    horizontal = p.random([true, false])
    const randomHue = p.random(0, 360)
    const complementHue = ((randomHue + 180) % 360) + p.random(-30, 30)
    colors.push(p.color(randomHue, p.random(80, 100), p.random(50, 100)))
    colors.push(p.color(complementHue, p.random(10, 40), p.random(0, 30)))

    const startFactor = 0.2
    const endFactor = 0.4
    for (let i = 0; i < numStartingPoints; i++) {
      const x = p.random(p.width * -endFactor, p.width * endFactor)
      const y = p.random(p.height * startFactor, p.height * endFactor) * p.random([-1, 1])
      const vector = p.createVector(x, y)
      let isValid = true
      for (const startingPoint of startingPoints) {
        if (Math.abs(vector.x - startingPoint.x) < minDistanceBetweenPoints) {
          isValid = false
          break
        }
      }
      if (isValid) {
        startingPoints.push(vector)
      } else {
        i--
      }
    }
    if (startingPoints.every((point) => point.x > 0) || startingPoints.every((point) => point.x < 0)) {
      for (const point of startingPoints) {
        point.x *= p.random([-1, 1])
      }
    }
    startingPoints.sort((a, b) => a.x - b.x)
    for (let i = 0; i < startingPoints.length; i++) {
      const currentX = startingPoints[i].x
      const nextX = i + 1 < startingPoints.length ? startingPoints[i + 1].x : p.width / 2
      const prevX = i - 1 >= 0 ? startingPoints[i - 1].x : -p.width / 2
      const width = Math.max(Math.abs(nextX - currentX), Math.abs(prevX - currentX))
      widths.push(width)
      const stepOffset = p.random(15, 25)
      stepOffsets.push(stepOffset)
      rotationsZ.push(p.random(-5, 5))
      rotationsX.push(p.random(-30, -10))
    }
  }

  p.draw = () => {
    p.background(colors[1])
    if (horizontal) p.rotateZ(90)
    p.noStroke()
    for (let i = 0; i < startingPoints.length; i++) {
      const startingPoint = startingPoints[i]
      const width = widths[i] / Math.sqrt(2)
      const stepOffset = stepOffsets[i]
      p.push()
      p.translate(startingPoint.x, startingPoint.y, 0)
      if (startingPoint.y < 0) p.rotateZ(180)
      const stepCount = (Math.abs(startingPoint.y) * 2) / stepOffset
      drawStack(width, width, stepOffset, stepCount, rotationsZ[i], rotationsX[i], i)
      p.pop()
    }
  }

  function drawStack(
    width: number,
    height: number,
    stepOffset: number,
    stepCount: number,
    stepRotationZ: number,
    stepRotationX: number,
    count: number,
  ) {
    p.push()
    p.rotateX(90)
    for (let i = 0; i < stepCount; i++) {
      p.push()
      const n = p.noise(i, count * 1000)
      p.scale(p.map(n, 0, 1, 0.8, 1.2))
      colors[0].setAlpha(p.map(i, 0, stepCount, 50, 10))
      p.fill(colors[0])
      p.rotateX(stepRotationX)
      p.rotateZ(i * stepRotationZ)
      p.scale(width, height)
      p.model(geometry)
      p.pop()
      p.translate(0, 0, stepOffset)
    }
    p.pop()
  }
}
