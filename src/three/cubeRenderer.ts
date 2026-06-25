/**
 * Three.js cube renderer. Manages scene, camera, lights, cube mesh.
 * Isolated from React — receives cube state as plain data.
 */

import * as THREE from 'three'
import type { CubeState, FaceColor } from '../cube/index.js'

/** Map cube face colors to hex values */
const COLOR_MAP: Record<FaceColor, number> = {
  W: 0xffffff, // White  - U
  Y: 0xffff00, // Yellow - D
  R: 0xff2020, // Red    - F
  O: 0xff8000, // Orange - B
  B: 0x0040ff, // Blue   - L
  G: 0x00b050, // Green  - R
}

const GAP = 0.05
const CUBIE_SIZE = 1.0
const TOTAL = CUBIE_SIZE + GAP

/**
 * CubeRenderer owns the Three.js scene and renders the 3x3x3 cube.
 */
export class CubeRenderer {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private cubieMeshes: THREE.Mesh[] = []
  private animFrameId: number | null = null
  private isDragging = false
  private lastMouseX = 0
  private lastMouseY = 0
  private cubeGroup: THREE.Group

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x1a1a2e)

    const w = canvas.clientWidth || 400
    const h = canvas.clientHeight || 400
    this.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100)
    this.camera.position.set(4, 4, 6)
    this.camera.lookAt(0, 0, 0)

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    this.renderer.setSize(w, h, false)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.6)
    this.scene.add(ambient)
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
    dirLight.position.set(5, 10, 7)
    this.scene.add(dirLight)

    // Cube group (for rotation)
    this.cubeGroup = new THREE.Group()
    this.scene.add(this.cubeGroup)

    this.buildCubieMeshes()
    this.attachPointerHandlers(canvas)
    this.startRenderLoop()

    // Handle resize
    const resizeObserver = new ResizeObserver(() => this.handleResize(canvas))
    resizeObserver.observe(canvas)
  }

  private handleResize(canvas: HTMLCanvasElement) {
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h, false)
  }

  /**
   * Build 27 cubie meshes (3x3x3). Each cubie has 6 faces with materials.
   * Sticker colors are set via updateCubeState().
   */
  private buildCubieMeshes() {
    this.cubieMeshes = []
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const geometry = new THREE.BoxGeometry(CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE)
          // 6 materials: right, left, top, bottom, front, back (Three.js BoxGeometry order)
          const materials = Array(6).fill(null).map(() =>
            new THREE.MeshLambertMaterial({ color: 0x111111 })
          )
          const mesh = new THREE.Mesh(geometry, materials)
          mesh.position.set(x * TOTAL, y * TOTAL, z * TOTAL)
          // Store grid position for later state updates
          mesh.userData = { gx: x, gy: y, gz: z }
          this.cubeGroup.add(mesh)
          this.cubieMeshes.push(mesh)
        }
      }
    }
  }

  /**
   * Update all cubie face colors to reflect the given cube state.
   *
   * CubeState face index → 3D position mapping:
   *   U (White):  y=+1 cubies, top face (Three.js material index 2)
   *   D (Yellow): y=-1 cubies, bottom face (material index 3)
   *   F (Red):    z=+1 cubies, front face (material index 4)
   *   B (Orange): z=-1 cubies, back face (material index 5)
   *   L (Blue):   x=-1 cubies, left face (material index 1)
   *   R (Green):  x=+1 cubies, right face (material index 0)
   *
   * Face sticker ordering (row-major, 0–8):
   *   U: left-to-right, top-to-bottom viewed from above (z decreasing, x increasing)
   *   D: left-to-right, top-to-bottom viewed from below
   *   F: left-to-right, top-to-bottom viewed from front
   *   B: left-to-right, top-to-bottom viewed from back
   *   L: left-to-right, top-to-bottom viewed from left
   *   R: left-to-right, top-to-bottom viewed from right
   */
  updateCubeState(cube: CubeState) {
    for (const mesh of this.cubieMeshes) {
      const { gx, gy, gz } = mesh.userData as { gx: number; gy: number; gz: number }
      const mats = mesh.material as THREE.MeshLambertMaterial[]

      // Right face (x=+1): material index 0
      if (gx === 1) {
        const row = 1 - gy  // gy 1→row 0, gy 0→row 1, gy -1→row 2
        const col = 1 - gz  // gz 1→col 0, gz 0→col 1, gz -1→col 2
        const idx = row * 3 + col
        mats[0].color.setHex(COLOR_MAP[cube.R[idx]])
      } else {
        mats[0].color.setHex(0x111111)
      }

      // Left face (x=-1): material index 1
      if (gx === -1) {
        const row = 1 - gy
        const col = gz + 1  // gz -1→col 0, gz 0→col 1, gz 1→col 2
        const idx = row * 3 + col
        mats[1].color.setHex(COLOR_MAP[cube.L[idx]])
      } else {
        mats[1].color.setHex(0x111111)
      }

      // Top face (y=+1): material index 2
      if (gy === 1) {
        const row = gz + 1  // z=-1→row 0, z=0→row 1, z=1→row 2
        const col = gx + 1  // x=-1→col 0, x=0→col 1, x=1→col 2
        const idx = row * 3 + col
        mats[2].color.setHex(COLOR_MAP[cube.U[idx]])
      } else {
        mats[2].color.setHex(0x111111)
      }

      // Bottom face (y=-1): material index 3
      if (gy === -1) {
        const row = 1 - (gz + 1)  // z=1→row 0, z=0→row 1, z=-1→row 2
        const col = gx + 1
        const idx = row * 3 + col
        mats[3].color.setHex(COLOR_MAP[cube.D[idx]])
      } else {
        mats[3].color.setHex(0x111111)
      }

      // Front face (z=+1): material index 4
      if (gz === 1) {
        const row = 1 - gy
        const col = gx + 1
        const idx = row * 3 + col
        mats[4].color.setHex(COLOR_MAP[cube.F[idx]])
      } else {
        mats[4].color.setHex(0x111111)
      }

      // Back face (z=-1): material index 5
      if (gz === -1) {
        const row = 1 - gy
        const col = 1 - gx  // x=1→col 0, x=0→col 1, x=-1→col 2
        const idx = row * 3 + col
        mats[5].color.setHex(COLOR_MAP[cube.B[idx]])
      } else {
        mats[5].color.setHex(0x111111)
      }
    }
  }

  private attachPointerHandlers(canvas: HTMLCanvasElement) {
    canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true
      this.lastMouseX = e.clientX
      this.lastMouseY = e.clientY
    })

    canvas.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return
      const dx = e.clientX - this.lastMouseX
      const dy = e.clientY - this.lastMouseY
      this.cubeGroup.rotation.y += dx * 0.01
      this.cubeGroup.rotation.x += dy * 0.01
      this.lastMouseX = e.clientX
      this.lastMouseY = e.clientY
    })

    window.addEventListener('mouseup', () => {
      this.isDragging = false
    })

    // Touch support
    let lastTouchX = 0
    let lastTouchY = 0
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault()
      lastTouchX = e.touches[0].clientX
      lastTouchY = e.touches[0].clientY
    }, { passive: false })

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault()
      const dx = e.touches[0].clientX - lastTouchX
      const dy = e.touches[0].clientY - lastTouchY
      this.cubeGroup.rotation.y += dx * 0.01
      this.cubeGroup.rotation.x += dy * 0.01
      lastTouchX = e.touches[0].clientX
      lastTouchY = e.touches[0].clientY
    }, { passive: false })
  }

  private startRenderLoop() {
    const loop = () => {
      this.animFrameId = requestAnimationFrame(loop)
      this.renderer.render(this.scene, this.camera)
    }
    loop()
  }

  dispose() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId)
    }
    this.renderer.dispose()
    for (const mesh of this.cubieMeshes) {
      mesh.geometry.dispose()
      const mats = mesh.material as THREE.MeshLambertMaterial[]
      for (const m of mats) m.dispose()
    }
  }
}
