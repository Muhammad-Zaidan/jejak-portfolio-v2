'use client'
import { useEffect, useRef } from 'react'
import type { ShaderMaterial } from 'three'
import photo from '@/assets/foto-cutout.webp'

/**
 * The portrait photo, tilting a touch toward the pointer like a card.
 * The pointer stirs a fading, liquid trail, and wherever the trail lies the photo becomes an orange hologram.
 */
export function Hologram({ hint }: { hint: string }) {
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = box.current!
    let dead = false
    let stop = () => {}

    ;(async () => {
      // three.js is heavy, so it loads after the page instead of with it
      const T = await import('three')
      if (dead) return

      const calm = matchMedia('(prefers-reduced-motion: reduce)').matches
      const renderer = new T.WebGLRenderer({ antialias: true, alpha: true })
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)) // the canvas fills the hero; 1.5x keeps it at full frame rate on laptops
      const canvas = renderer.domElement
      canvas.className = 'hologram-canvas'
      el.prepend(canvas)

      const tex = await new T.TextureLoader().loadAsync(photo.src)
      if (dead) return renderer.dispose()
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy() // keeps the photo crisp when the card tilts

      // Trail: two low-res buffers take turns; each frame keeps most of the last one, lets it drift, and paints the new stroke.
      const rt = () => new T.WebGLRenderTarget(1, 1, { type: T.HalfFloatType })
      let read = rt()
      let write = rt()
      const quad = new T.Mesh(
        new T.PlaneGeometry(2, 2),
        new T.ShaderMaterial({
          uniforms: {
            uPrev: { value: null },
            uFrom: { value: new T.Vector2() },
            uTo: { value: new T.Vector2() },
            uInk: { value: 0 },
            uAspect: { value: 1 },
            uTime: { value: 0 },
            uDecay: { value: 0.955 },
          },
          vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
          fragmentShader: `
            uniform sampler2D uPrev; uniform vec2 uFrom, uTo; uniform float uInk, uAspect, uTime, uDecay;
            varying vec2 vUv;
            void main() {
              // a slow swirl, so old ink curls like liquid instead of just fading
              vec2 swirl = vec2(sin(vUv.y * 9.0 + uTime * 1.3), cos(vUv.x * 8.0 - uTime * 1.1)) * 0.0016 + vec2(0.0, 0.0007);
              float ink = texture2D(uPrev, vUv - swirl).r * uDecay;
              // soft brush along the segment the pointer travelled this frame, so fast moves leave a line, not dots
              vec2 a = uFrom, b = uTo, p = vUv;
              a.x *= uAspect; b.x *= uAspect; p.x *= uAspect;
              vec2 ab = b - a;
              float t = clamp(dot(p - a, ab) / max(dot(ab, ab), 1e-6), 0.0, 1.0);
              float d = length(p - (a + ab * t));
              ink += uInk * (1.0 - smoothstep(0.0, 0.14, d));
              gl_FragColor = vec4(min(ink, 1.2), 0.0, 0.0, 1.0);
            }`,
        }),
      )
      const trailScene = new T.Scene()
      trailScene.add(quad)
      const trailCam = new T.Camera()
      const tu = (quad.material as ShaderMaterial).uniforms

      const scene = new T.Scene()
      const camera = new T.PerspectiveCamera(30, 1, 0.1, 100)
      camera.position.set(0, 0, 5.4)
      const h = 2.6
      const u = {
        uPhoto: { value: tex },
        uTrail: { value: read.texture },
        uRes: { value: new T.Vector2() },
        uTime: { value: 0 },
        uHolo: { value: new T.Color() },
        uBg: { value: new T.Color() },
      }
      const figure = new T.Mesh(
        new T.PlaneGeometry(h * (photo.width / photo.height), h),
        new T.ShaderMaterial({
          uniforms: u,
          transparent: true,
          vertexShader: `
            varying vec2 vUv; varying vec3 vPos;
            void main() {
              vUv = uv;
              vec4 mv = modelViewMatrix * vec4(position, 1.0);
              vPos = mv.xyz;
              gl_Position = projectionMatrix * mv;
            }`,
          fragmentShader: `
            uniform sampler2D uPhoto, uTrail; uniform vec2 uRes; uniform float uTime; uniform vec3 uHolo, uBg;
            varying vec2 vUv; varying vec3 vPos;
            void main() {
              vec4 c = texture2D(uPhoto, vUv);
              float alpha = c.a * smoothstep(0.0, 0.14, vUv.y); // the body fades out at the bottom edge
              if (alpha < 0.02) discard;
              vec3 n = vec3(0.0, 0.0, 1.0);
              vec3 col = c.rgb;
              // the hologram's contour lines follow the photo's light and shade, like a terrain map of the face
              float vD = dot(c.rgb, vec3(0.3, 0.59, 0.11));

              // liquid edge: the trail is thresholded with a little moving noise
              float ink = texture2D(uTrail, gl_FragCoord.xy / uRes).r;
              float wob = sin(gl_FragCoord.x * 0.045 + uTime * 2.0) * sin(gl_FragCoord.y * 0.05 - uTime * 1.7) * 0.08;
              float holo = smoothstep(0.28, 0.42, ink + wob);
              if (holo > 0.0) {
                float fres = pow(1.0 - abs(dot(n, normalize(-vPos))), 1.6);
                float scan = step(0.5, fract(gl_FragCoord.y / 4.0 - uTime * 1.2));
                float contour = 1.0 - smoothstep(0.0, 0.09, abs(fract(vD * 22.0) - 0.5) * 2.0 - 0.82); // depth lines, like a drawing
                float glow = 0.25 + 1.2 * fres + 0.6 * contour;
                vec3 h = mix(uBg, uHolo * (0.5 + 0.5 * scan) * glow, clamp(0.25 + fres + 0.5 * contour + 0.25 * scan, 0.0, 1.0));
                float rim = smoothstep(0.28, 0.33, ink + wob) - smoothstep(0.36, 0.44, ink + wob); // bright edge on the liquid
                col = mix(col, h + uHolo * rim * 0.9, holo);
              }
              gl_FragColor = vec4(col, alpha);
            }`,
        }),
      )
      const pivot = new T.Group()
      pivot.add(figure)
      scene.add(pivot)

      // Outside the figure the same trail lights up a faint orange dot grid: a quiet echo of the hologram.
      const dots = new T.Mesh(
        new T.PlaneGeometry(2, 2),
        new T.ShaderMaterial({
          uniforms: { uTrail: u.uTrail, uRes: u.uRes, uHolo: u.uHolo, uPr: { value: 1 } },
          transparent: true,
          depthTest: false,
          depthWrite: false,
          vertexShader: 'void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }',
          fragmentShader: `
            uniform sampler2D uTrail; uniform vec2 uRes; uniform vec3 uHolo; uniform float uPr;
            void main() {
              float ink = smoothstep(0.04, 0.5, texture2D(uTrail, gl_FragCoord.xy / uRes).r);
              vec2 cell = mod(gl_FragCoord.xy, 16.0 * uPr) - 8.0 * uPr;
              float dot = 1.0 - smoothstep(0.9 * uPr, 1.7 * uPr, length(cell));
              gl_FragColor = vec4(uHolo, (dot * 0.7 + 0.05) * ink);
            }`,
        }),
      )
      dots.frustumCulled = false
      dots.renderOrder = -1
      scene.add(dots)
      const du = (dots.material as ShaderMaterial).uniforms

      const css = (name: string) => getComputedStyle(el).getPropertyValue(name).trim()
      // the shader writes without colour conversion, so theme colours go in as raw sRGB, like the photo
      const theme = () => {
        u.uHolo.value.setStyle(css('--orange')).convertLinearToSRGB()
        u.uBg.value.setStyle(css('--bg')).convertLinearToSRGB()
      }
      theme()
      const scheme = matchMedia('(prefers-color-scheme: dark)')
      scheme.addEventListener('change', theme)

      const size = () => {
        const { width, height } = el.getBoundingClientRect()
        renderer.setSize(width, height, false)
        const pr = renderer.getPixelRatio()
        u.uRes.value.set(width * pr, height * pr)
        // the trail only needs to be soft, so a quarter resolution is plenty
        read.setSize(Math.ceil(width / 4), Math.ceil(height / 4))
        write.setSize(Math.ceil(width / 4), Math.ceil(height / 4))
        tu.uAspect.value = width / height
        du.uPr.value = pr
        camera.aspect = width / height
        camera.updateProjectionMatrix()
        // Stand the figure on the bottom edge at 86% of the hero; on phones higher and smaller so the text below stays clear.
        const view = 2 * camera.position.z * Math.tan(T.MathUtils.degToRad(camera.fov / 2))
        const phone = width < 640
        const tall = (phone ? 0.8 : 0.86) * view
        const lift = phone ? (70 / height) * view : 0
        figure.scale.setScalar(tall / h)
        base = -view / 2 + lift + tall / 2
      }
      let base = 0
      const ro = new ResizeObserver(size)
      ro.observe(el)
      size()

      // Raw pointer, a lightly smoothed brush that paints the trail, and a heavily smoothed one the figure turns toward.
      const raw = { x: 0.5, y: 0.5, on: false }
      const brush = { x: 0.5, y: 0.5 }
      const look = { x: 0, y: 0, vx: 0, vy: 0 }
      let fresh = true
      // listen on the whole hero, so text laid over the canvas doesn't read as the pointer leaving
      const zone = el.closest('section') ?? el
      const move = (e: PointerEvent) => {
        const b = el.getBoundingClientRect()
        raw.x = (e.clientX - b.left) / b.width
        raw.y = 1 - (e.clientY - b.top) / b.height
        raw.on = true
        if (fresh) Object.assign(brush, { x: raw.x, y: raw.y }) // start the stroke where the pointer enters
        fresh = false
      }
      const leave = () => {
        raw.on = false
        fresh = true
      }
      const up = (e: PointerEvent) => e.pointerType !== 'mouse' && leave() // touch: lift the finger, let the ink fade
      zone.addEventListener('pointermove', move)
      zone.addEventListener('pointerdown', move)
      zone.addEventListener('pointerleave', leave)
      zone.addEventListener('pointerup', up)

      const clock = new T.Clock()
      let raf = 0
      let seen = true
      const frame = () => {
        const dt = Math.min(clock.getDelta(), 1 / 30)
        const t = clock.elapsedTime
        const ease = (rate: number) => (calm ? 1 : 1 - Math.exp(-dt * rate))

        const fromX = brush.x
        const fromY = brush.y
        brush.x += (raw.x - brush.x) * ease(16)
        brush.y += (raw.y - brush.y) * ease(16)
        const speed = Math.hypot(brush.x - fromX, brush.y - fromY) / Math.max(dt, 1e-3)
        tu.uFrom.value.set(fromX, fromY)
        tu.uTo.value.set(brush.x, brush.y)
        // resting on the figure keeps a pool open; moving pours in more
        tu.uInk.value = raw.on ? Math.min(0.5, (0.09 + speed * 0.12) * dt * 60) : 0
        tu.uTime.value = t
        tu.uPrev.value = read.texture
        renderer.setRenderTarget(write)
        renderer.render(trailScene, trailCam)
        renderer.setRenderTarget(null)
        ;[read, write] = [write, read]
        u.uTrail.value = read.texture
        u.uTime.value = t

        // Slow, weighty turn toward the pointer on a critically damped spring: it eases in and out instead of
        // jumping to a new speed whenever the pointer moves.
        const lx = raw.on ? (raw.x - 0.5) * 2 : 0
        const ly = raw.on ? (raw.y - 0.5) * 2 : 0
        if (calm) Object.assign(look, { x: lx, y: ly })
        else {
          const k = 7
          const c = 2 * Math.sqrt(k)
          look.vx += ((lx - look.x) * k - look.vx * c) * dt
          look.vy += ((ly - look.y) * k - look.vy * c) * dt
          look.x += look.vx * dt
          look.y += look.vy * dt
        }
        // a flat photo: only a slight card-like tilt, so it never shows its edge
        pivot.rotation.y = look.x * 0.07
        pivot.rotation.x = -look.y * 0.04
        pivot.position.y = base

        renderer.render(scene, camera)
        canvas.classList.add('is-ready')
        raf = seen ? requestAnimationFrame(frame) : 0
      }
      // stop drawing while the hero is scrolled away
      const io = new IntersectionObserver(([e]) => {
        seen = e.isIntersecting
        if (seen && !raf) {
          clock.getDelta()
          raf = requestAnimationFrame(frame)
        }
      })
      io.observe(el)
      raf = requestAnimationFrame(frame)

      stop = () => {
        cancelAnimationFrame(raf)
        io.disconnect()
        ro.disconnect()
        scheme.removeEventListener('change', theme)
        zone.removeEventListener('pointermove', move)
        zone.removeEventListener('pointerdown', move)
        zone.removeEventListener('pointerleave', leave)
        zone.removeEventListener('pointerup', up)
        read.dispose()
        write.dispose()
        renderer.dispose()
        canvas.remove()
      }
    })()

    return () => {
      dead = true
      stop()
    }
  }, [])

  return (
    <div ref={box} className="hologram absolute inset-0 touch-pan-y">
      <p className="hologram-hint">{hint}</p>
    </div>
  )
}
