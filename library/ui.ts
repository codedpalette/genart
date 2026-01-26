import "./ui.css"
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

interface GMAN_webgl_memory {
  getMemoryInfo(): { memory: Record<string, number>; resources: Record<string, number> }
  getResourcesInfo(resource: new () => unknown): { size: number; stackCreated: string }[]
}

export function addMemoryInfo(sketch: Sketch, node: HTMLElement = document.body): Sketch {
  let memoryExtension: GMAN_webgl_memory | null = null
  let memoryInfoPanel: HTMLDivElement

  return (p: p5) => {
    sketch(p)
    const { setup, draw } = p

    p.setup = () => {
      setup()
      const context = p.drawingContext as WebGL2RenderingContext
      memoryExtension = context.getExtension("GMAN_webgl_memory") as GMAN_webgl_memory | null

      let isPanelVisible = false
      memoryInfoPanel = document.createElement("div")
      memoryInfoPanel.style.display = isPanelVisible ? "block" : "none"
      memoryInfoPanel.id = "memory-info"

      const memoryInfoToggle = document.createElement("button")
      memoryInfoToggle.textContent = `${isPanelVisible ? "Hide" : "Show"} Memory Info`
      memoryInfoToggle.id = "memory-info-toggle"

      const memoryInfoContainer = document.createElement("div")
      memoryInfoContainer.id = "memory-info-container"
      memoryInfoContainer.append(memoryInfoPanel, memoryInfoToggle)

      memoryInfoToggle.addEventListener("click", () => {
        isPanelVisible = !isPanelVisible
        memoryInfoPanel.style.display = isPanelVisible ? "block" : "none"
        memoryInfoToggle.textContent = `${isPanelVisible ? "Hide" : "Show"} Memory Info`
      })

      node.appendChild(memoryInfoContainer)
    }

    p.draw = () => {
      draw()
      if (memoryExtension) {
        const memoryInfo = memoryExtension.getMemoryInfo()
        memoryInfoPanel.textContent = JSON.stringify(memoryInfo, null, 2)
      }
    }
  }
}

export function addUI(sketch: Sketch, node: HTMLElement = document.body): Sketch {
  return addMemoryInfo(addStats(sketch), node)
}
