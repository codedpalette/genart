import GUI from "lil-gui"
import type p5 from "p5"

interface Building {
	position: p5.Vector
	size: p5.Vector
}

export default (p: p5) => {
	const maxHalfKernelSize = 30
	const config = {
		showFramebuffer: true,
		useGamma: true,
		sigma: 20,
		exposure: 2.5,
		cameraHeight: 3,
		animationTime: 8,
	}

	const numBuildingRows = 25
	const numBuildingColumns = 11

	let camera: p5.Camera
	let mainFramebuffer: p5.Framebuffer
	let bloomFramebuffer: p5.Framebuffer
	let bloomShader: p5.Shader
	let gaussianBlurShader: p5.Shader
	let gaussianBlurKernel: Float32Array
	let backgroundImage: p5.Image

	let buildings: Building[]
	let buildingsGeometry: p5.Geometry
	let windowsGeometry: p5.Geometry

	let startRecording: number | undefined

	p.keyTyped = () => {
		if (p.key === "r") {
			startRecording = p.frameCount
			p.startRecording()
		}
	}

	p.setup = () => {
		const renderer = p.createCanvas(1000, 1000, p.WEBGL)
		p.frameRate(30)

		const gui = new GUI()
		gui.add(config, "showFramebuffer")
		gui.add(config, "useGamma")
		gui.add(config, "sigma", 0, 30).onChange(() => {
			gaussianBlurKernel = generateHalfGaussianKernel(config.sigma, maxHalfKernelSize)
		})
		gui.add(config, "exposure", 0, 10)
		gui.add(config, "cameraHeight", 1, 5)

		mainFramebuffer = p.createFramebuffer()
		bloomFramebuffer = p.createFramebuffer()
		bloomShader = p.createFilterShader(bloom)
		gaussianBlurShader = p.createFilterShader(gaussianBlur)
		gaussianBlurKernel = generateHalfGaussianKernel(config.sigma, maxHalfKernelSize)
		backgroundImage = drawBackground(p.createGraphics(p.width, p.height))
		camera = p.createCamera()
		p.setCamera(camera)
		p.rectMode(p.CENTER)
		p.noStroke()

		renderer.doubleClicked(() => {
			p.freeGeometry(buildingsGeometry)
			p.freeGeometry(windowsGeometry)
			initGeometry()
		})
		initGeometry()
		camera.perspective(2 * p.atan(p.height / 2 / 800), p.width / p.height, 0.01, 50)

		p.setRecording({ mimeType: "image/png" })
	}

	function initBuildings() {
		buildings = []
		for (let i = 0; i < numBuildingRows; i++) {
			for (let j = 0; j < numBuildingColumns; j++) {
				const x = p.map(i, 0, numBuildingRows, -numBuildingRows / 2, numBuildingRows / 2)
				const y = p.map(j, 0, numBuildingColumns, -numBuildingColumns / 2, numBuildingColumns / 2)
				const width = p.random(0.4, 0.9)
				const height = 0.5 + p.random(0, 5)
				const depth = p.random(0.4, 0.9)
				buildings.push({
					position: p.createVector(x, 1, y),
					size: p.createVector(width, height, depth),
				})
			}
		}
	}

	function initGeometry() {
		initBuildings()
		p.curveDetail(10)

		const lightColors = [
			p.color(255, 255, 100),
			p.color(255, 100, 255),
			p.color(100, 255, 255),
			p.color(50, 255, 50),
			p.color(50, 50, 255),
			p.color(255, 50, 50),
		]
		const buildingColor = p.color(10)

		buildingsGeometry = p.buildGeometry(() => {
			p.fill(buildingColor)
			for (const building of buildings) {
				p.push()
				p.translate(building.position.x, building.position.y, building.position.z)
				p.translate(0, -building.size.y / 2, 0)
				p.box(building.size.x, building.size.y, building.size.z)
				p.pop()
			}
		})

		windowsGeometry = p.buildGeometry(() => {
			for (const building of buildings) {
				const numRows = Math.floor((10 * building.size.y) / 2)
				const borderRadius = 0.2
				const offset = 0.501 // to avoid z-fighting

				p.push()
				p.translate(building.position.x, building.position.y, building.position.z)
				p.translate(0, -building.size.y / 2, 0)
				p.scale(building.size.x, building.size.y / 2, building.size.z)
				for (let side = 0; side < 4; side++) {
					const numColumns = Math.floor(p.random(2, 5))
					p.push()
					if (side === 0) {
						p.translate(0, 0, offset)
					} else if (side === 1) {
						p.translate(offset, 0, 0)
					} else if (side === 2) {
						p.translate(0, 0, -offset)
					} else if (side === 3) {
						p.translate(-offset, 0, 0)
					}
					if (side % 2 === 1) {
						p.rotateY(p.PI / 2)
					}
					for (let i = 0; i < numRows; i++) {
						for (let j = 0; j < numColumns; j++) {
							if (p.random() < 0.7) continue
							const y = p.map(i, 0, numRows, -1, 1)
							const x = p.map(j, 0, numColumns, -0.5, 0.5)
							const scaleX = 1 / numColumns
							const scaleY = 2 / numRows
							p.push()
							p.fill(p.random(lightColors))
							p.translate(x + scaleX / 2, y + scaleY / 2)
							p.scale(scaleX, scaleY, 1)
							p.scale(0.5)
							p.rect(0, 0, 0.8, 1, borderRadius)
							p.scale(0.85)
							p.box(0.8, 1, 0.01)
							p.pop()
						}
					}
					p.pop()
				}
				p.pop()
			}
		})
	}

	function drawScene(main: boolean) {
		const gl = p.drawingContext as WebGLRenderingContext
		p.clear()
		p.setCamera(camera)
		for (let j = 0; j < 5; j++) {
			p.push()
			const x = 0 //(i - 1) * numBuildingRows
			const y = (j - 2) * numBuildingColumns
			p.translate(x, 0, y)
			if (!main) gl.colorMask(false, false, false, false) // TODO: Report to p5.js
			p.model(buildingsGeometry)
			if (!main) gl.colorMask(true, true, true, true)
			p.pop()
		}
		for (let j = 0; j < 5; j++) {
			p.push()
			const x = 0 //(i - 1) * numBuildingRows
			const y = (j - 2) * numBuildingColumns
			p.translate(x, 0, y)
			p.model(windowsGeometry)
			p.pop()
		}
	}

	function drawBackground(backgroundGraphics: p5.Graphics) {
		const context = backgroundGraphics.drawingContext as CanvasRenderingContext2D
		const gradient = context.createLinearGradient(0, 0, 0, backgroundGraphics.height)
		gradient.addColorStop(0, "rgb(0, 0, 70)")
		gradient.addColorStop(1, "rgb(0, 0, 10)")
		context.fillStyle = gradient
		context.fillRect(0, 0, backgroundGraphics.width, backgroundGraphics.height)
		return backgroundGraphics.get()
	}

	p.draw = () => {
		const framesPerAnimation = config.animationTime * p.frameRate()
		if (startRecording && p.frameCount - startRecording > framesPerAnimation * 2) {
			p.stopRecording()
			startRecording = undefined
		}
		const seconds = p.millis() / 1000
		const t = (seconds % config.animationTime) / config.animationTime // in [0, 1)
		const cameraZ = p.map(t, 0, 1, -numBuildingColumns / 2, numBuildingColumns / 2)
		const cameraHeight = config.cameraHeight + Math.sin(seconds / 2)
		const cameraPosition = p.createVector(0, -cameraHeight, cameraZ)
		const forwardVector = p.createVector(0, 1).rotate(-t * p.TWO_PI)
		const lookAtVector = p.createVector(forwardVector.x, 0, forwardVector.y).add(cameraPosition)
		camera.setPosition(cameraPosition.x, cameraPosition.y, cameraPosition.z)
		camera.lookAt(lookAtVector.x, lookAtVector.y, lookAtVector.z)

		mainFramebuffer.draw(() => drawScene(true))
		bloomFramebuffer.draw(() => {
			drawScene(false)
			gaussianBlurShader.setUniform("kernel", gaussianBlurKernel)
			gaussianBlurShader.setUniform("direction", [1, 0])
			p.filter(gaussianBlurShader)
			gaussianBlurShader.setUniform("direction", [0, 1])
			p.filter(gaussianBlurShader)
		})

		p.push()
		p.camera(0, 0, 800, 0, 0, 0)
		p.perspective(2 * p.atan(p.height / 2 / 800), p.width / p.height, 0.1 * 800, 20 * 800)
		;(p.drawingContext as WebGL2RenderingContext).depthMask(false)
		p.background(backgroundImage)
		;(p.drawingContext as WebGL2RenderingContext).depthMask(true)
		if (config.showFramebuffer) {
			//p.image(backgroundGraphics, -p.width / 2, -p.height / 2, p.width, p.height)
			p.shader(bloomShader)
			bloomShader.setUniform("sceneColor", mainFramebuffer.color)
			bloomShader.setUniform("sceneDepth", mainFramebuffer.depth)
			bloomShader.setUniform("bloomColor", bloomFramebuffer)
			bloomShader.setUniform("exposure", config.exposure)
			bloomShader.setUniform("useGamma", config.useGamma)
			//p.texture(bloomFramebuffer.color)
		} else {
			p.texture(mainFramebuffer.color)
		}
		p.plane(p.width, -p.height)
		p.pop()
		p.filter(p.BLUR, 0.1)
	}

	function generateHalfGaussianKernel(sigma: number, halfKernelSize: number) {
		const kernel = new Float32Array(halfKernelSize)
		let result = 0
		let sum = 0
		if (sigma === 0) {
			kernel.fill(0)
			kernel[0] = 1.0
		} else {
			const SS2 = sigma * sigma * 2
			kernel[0] = 1
			sum = 1
			for (let x = 1; x < halfKernelSize; ++x) {
				result = Math.exp(-(x * x) / SS2)
				kernel[x] = result
				sum += result * 2
			}

			// normalize kernel
			for (let i = 0; i <= halfKernelSize; ++i) kernel[i] /= sum
		}
		return kernel
	}

	const gaussianBlur = /*glsl*/ `
    precision highp float;
    varying vec2 vTexCoord;
    uniform sampler2D tex0;
    uniform vec2 canvasSize;    

    const int MAX_KERNEL = ${maxHalfKernelSize};
    uniform float kernel[MAX_KERNEL];
    uniform vec2 direction; // horizontal=(1,0) or vertical=(0,1)

    void main() {
      vec4 sceneColor = texture2D(tex0, vTexCoord);
      vec3 color = sceneColor.rgb * kernel[0];
      vec2 offset;

      // optimize using linear texture filtering (with half texels)
      float k;    // interpolated kernel, H = H1 + H2
      float t;    // interpolated alpha, t = H2 / H
      for(int i = 1; i < MAX_KERNEL; i += 2) {
          k = kernel[i] + kernel[i+1];
          t = kernel[i+1] / k;
          offset = direction * (float(i) + t) / canvasSize;
          color += texture2D(tex0, vTexCoord + offset).rgb * k;
          color += texture2D(tex0, vTexCoord - offset).rgb * k;
      }

      gl_FragColor = vec4(color, 1.0);
    }
  `

	const bloom = /*glsl*/ `		
    precision highp float;
    varying vec2 vTexCoord;
    uniform sampler2D sceneColor;    
		uniform sampler2D sceneDepth;
    uniform sampler2D bloomColor;    
    uniform vec2 canvasSize;  
    uniform float exposure;
    uniform bool useGamma;    
    
    void main() {
      vec4 sceneColor = texture2D(sceneColor, vTexCoord); 
			float sceneDepth = texture2D(sceneDepth, vTexCoord).r;      
      vec4 bloomColor = texture2D(bloomColor, vTexCoord);                 
      const float gamma = 2.2;      
      if (useGamma) {
         sceneColor.rgb = pow(sceneColor.rgb, vec3(gamma));
         bloomColor.rgb = pow(bloomColor.rgb, vec3(gamma));
      }      
      sceneColor.rgb += bloomColor.rgb;    			
      vec3 result = vec3(1.0) - exp(-sceneColor.rgb * exposure);
      if (useGamma) result = pow(result, vec3(1.0 / gamma));          
			vec3 fogColor = vec3(178.0/255.0, 189.0/255.0, 207.0/255.0);
			//result.rgb = mix(result.rgb, fogColor, pow(sceneDepth, 24.0));
      gl_FragColor = vec4(result, sceneColor.a);            
    }
  `
}
