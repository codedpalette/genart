import type p5 from "p5"

export default (p: p5) => {
  type Config = {
    numCurves: number
    innerAngleOffset: number
    endPointOffset: number
    innerRadiusFactor: number
  }

  let fillShader: p5.Shader
  let geometries: p5.Geometry[][] = []
  let colors: p5.Color[] = []
  let backgroundColor: p5.Color
  let widths: number[] = []
  let useShader: boolean[] = []

  p.setup = () => {
    const canvas = p.createCanvas(1000, 1000, p.WEBGL)
    p.angleMode(p.DEGREES)
    p.colorMode(p.HSL)
    fillShader = p.baseColorShader().modify({
      fragmentDeclarations: "in highp vec2 vVertTexCoord;",
      "vec4 getFinalColor": /*glsl*/ `(vec4 color) {
        float rand = fract(sin(vVertTexCoord.x) * 1000000.0) * vVertTexCoord.y;        
        //return color;
        return vec4(color.rgb, rand);
      }`,
    })
    fillShader.inspectHooks()

    init()
    canvas.doubleClicked(() => {
      init()
    })
  }
  p.draw = () => {
    p.background(backgroundColor)

    for (let i = 0; i < 2; i++) {
      p.push()
      if (useShader[i]) p.shader(fillShader)
      p.strokeWeight(widths[i])
      p.fill(colors[i])
      p.stroke(colors[i])
      p.rotate(i * 180)
      for (const geometry of geometries[i]) {
        p.model(geometry)
      }
      p.pop()
    }
  }

  function init() {
    for (const geometry of geometries.flat()) {
      p.freeGeometry(geometry)
    }
    geometries = []
    colors = []
    widths = []
    useShader = []
    const numCurves1 = Math.floor(p.random(5, 15))
    const numCurves2 = Math.floor(numCurves1 < 10 ? p.random(10, 15) : p.random(5, 10))
    const config1 = {
      numCurves: numCurves1,
      innerAngleOffset: p.random(-90, 90),
      endPointOffset: Math.floor(p.random(1, numCurves1)),
      innerRadiusFactor: p.random(0, 1),
    }
    const config2 = {
      numCurves: numCurves2,
      innerAngleOffset: config1.innerAngleOffset > 0 ? p.random(-90, 0) : p.random(0, 90),
      endPointOffset: Math.floor(p.random(1, numCurves2)),
      innerRadiusFactor: config1.innerRadiusFactor > 0.5 ? p.random(0, 0.5) : p.random(0.5, 1),
    }
    geometries.push(initGeometry(config1))
    geometries.push(initGeometry(config2))

    const isDarkBackground = p.random() > 0.5

    const useShader1 = p.random() > 0.5
    const useShader2 = p.random() > 0.5
    useShader.push(useShader1)
    useShader.push(useShader2)

    const alpha1 = useShader1 ? 1 : p.random(0.2, 0.4)
    const alpha2 = useShader2 ? 1 : p.random(0.2, 0.4)
    const hue1 = p.random(0, 360)
    const hue2 = ((hue1 + 180) % 360) + p.random(-30, 30)
    const sat1 = p.random(20, 100)
    const sat2 = sat1 > 60 ? p.random(20, 60) : p.random(60, 100)
    const light1 = isDarkBackground ? p.random(50, 90) : p.random(10, 50)
    const light2 = isDarkBackground ? p.random(50, 90) : p.random(10, 50)
    colors.push(p.color(hue1, sat1, light1, alpha1))
    colors.push(p.color(hue2, sat2, light2, alpha2))

    const width1 = p.random(1, 4)
    const width2 = width1 > 2 ? p.random(1, 2) : p.random(2, 4)
    widths.push(width1)
    widths.push(width2)

    backgroundColor = p.color(isDarkBackground ? p.random(0, 20) : p.random(80, 100))
  }

  function initGeometry(config: Config) {
    const geometries: p5.Geometry[] = []
    const { numCurves, innerAngleOffset, endPointOffset, innerRadiusFactor } = config
    const outerRadius = Math.min(p.width, p.height) / 2
    const innerRadius = outerRadius * innerRadiusFactor
    for (let i = 0; i < numCurves; i++) {
      const geometry = p.buildGeometry(() => {
        p.beginShape()
        const startAngle = (i / numCurves) * 360
        const endAngle = ((i + endPointOffset) / numCurves) * 360
        const p0 = fromPolar(outerRadius, startAngle)
        const p1 = fromPolar(innerRadius, startAngle + innerAngleOffset)
        const p2 = fromPolar(innerRadius, endAngle + innerAngleOffset)
        const p3 = fromPolar(outerRadius, endAngle)
        p.bezierVertex(p0.x, p0.y, 0, 0, 0)
        p.bezierVertex(p1.x, p1.y, 0, 0.25, 1)
        p.bezierVertex(p2.x, p2.y, 0, 0.75, 1)
        p.bezierVertex(p3.x, p3.y, 0, 1, 0)
        p.endShape()
      })
      geometries.push(geometry)
    }
    return geometries
  }

  function fromPolar(radius: number, angle: number) {
    return p.createVector(radius * p.cos(angle), radius * p.sin(angle))
  }
}
