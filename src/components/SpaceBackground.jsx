import { useEffect, useRef } from 'react'

const SHIPS = ['🛸', '🛰️', '☄️', '⭐']

function rand(min, max) {
  return Math.random() * (max - min) + min
}

export default function SpaceBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let raf = 0
    let width = 0
    let height = 0
    let last = performance.now()
    let nextMeteor = performance.now() + 2500

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    function buildScene() {
      const stars = []
      const count = Math.min(220, Math.floor((width * height) / 5500))
      for (let i = 0; i < count; i++) {
        stars.push({
          x: rand(0, width),
          y: rand(0, height),
          r: rand(0.5, 1.8),
          base: rand(0.3, 1),
          tw: rand(0.5, 2.5),
          phase: rand(0, Math.PI * 2),
          drift: rand(0.02, 0.12),
        })
      }

      const planets = []
      const planetCount = 2 + Math.floor(Math.random() * 2)
      for (let i = 0; i < planetCount; i++) {
        planets.push({
          x: rand(0.1, 0.9) * width,
          y: rand(0.12, 0.6) * height,
          r: rand(28, 60),
          hue: Math.floor(rand(200, 330)),
          float: rand(6, 14),
          phase: rand(0, Math.PI * 2),
        })
      }

      const ships = []
      for (let i = 0; i < 4; i++) {
        const fromLeft = i % 2 === 0
        ships.push({
          emoji: SHIPS[i % SHIPS.length],
          x: fromLeft ? rand(-60, -20) : rand(width + 20, width + 60),
          y: rand(0.1, 0.55) * height,
          vx: (fromLeft ? 1 : -1) * rand(0.4, 0.9),
          tilt: rand(-0.25, 0.25),
          size: rand(22, 40),
          bob: rand(8, 16),
          phase: rand(0, Math.PI * 2),
        })
      }

      return { stars, planets, ships }
    }

    let scene = null

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      scene = buildScene()
    }

    function drawPlanet(p, t) {
      const y = p.y + Math.sin(t * 0.3 + p.phase) * p.float * 0.3
      const g = ctx.createRadialGradient(p.x, y, 0, p.x, y, p.r)
      g.addColorStop(0, `hsla(${p.hue}, 80%, 75%, 0.9)`)
      g.addColorStop(0.6, `hsla(${p.hue}, 70%, 40%, 0.55)`)
      g.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(p.x, y, p.r, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = `hsla(${p.hue}, 70%, 80%, 0.35)`
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.ellipse(p.x, y, p.r * 1.6, p.r * 0.4, -0.3, 0, Math.PI * 2)
      ctx.stroke()
    }

    function draw(dt, t, now) {
      ctx.clearRect(0, 0, width, height)

      const ng = ctx.createRadialGradient(
        width * 0.5,
        height * 0.5,
        0,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.7,
      )
      ng.addColorStop(0, 'rgba(37, 99, 235, 0.06)')
      ng.addColorStop(0.5, 'rgba(124, 58, 237, 0.05)')
      ng.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = ng
      ctx.fillRect(0, 0, width, height)

      for (const p of scene.planets) drawPlanet(p, t)

      for (const s of scene.stars) {
        s.x += s.drift * dt
        if (s.x > width + 2) s.x = -2
        const a = s.base * (0.6 + 0.4 * Math.sin(t * s.tw + s.phase))
        ctx.globalAlpha = a
        ctx.fillStyle = '#fff'
        ctx.fillRect(s.x, s.y, s.r, s.r)
      }
      ctx.globalAlpha = 1

      if (!reduced) {
        if (now > nextMeteor) {
          const meteors = scene.meteors || (scene.meteors = [])
          if (meteors.length < 3) {
            meteors.push({
              x: rand(0.2, 0.9) * width,
              y: rand(0, 0.2) * height,
              vx: rand(-4.5, -2.5),
              vy: rand(2.2, 4),
              life: 1,
            })
          }
          nextMeteor = now + rand(2500, 6000)
        }
      }
      if (scene.meteors) {
        scene.meteors = scene.meteors.filter((m) => m.life > 0)
        for (const m of scene.meteors) {
          m.x += m.vx * dt * 60
          m.y += m.vy * dt * 60
          m.life -= dt * 0.6
          const grad = ctx.createLinearGradient(
            m.x,
            m.y,
            m.x - m.vx * 8,
            m.y - m.vy * 8,
          )
          grad.addColorStop(0, `rgba(255,255,255,${Math.max(0, m.life)})`)
          grad.addColorStop(1, 'rgba(255,255,255,0)')
          ctx.strokeStyle = grad
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.moveTo(m.x, m.y)
          ctx.lineTo(m.x - m.vx * 8, m.y - m.vy * 8)
          ctx.stroke()
        }
      }

      for (const s of scene.ships) {
        if (!reduced) {
          s.x += s.vx * dt * 60
          s.phase += dt
        }
        const y = s.y + Math.sin(s.phase) * s.bob * 0.4
        ctx.save()
        ctx.translate(s.x, y)
        ctx.rotate(s.vx > 0 ? s.tilt : s.tilt + Math.PI)
        ctx.font = `${s.size}px serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(s.emoji, 0, 0)
        ctx.restore()
        if (s.x > width + 50 || s.x < -50) {
          s.x = s.vx > 0 ? -50 : width + 50
          s.y = rand(0.1, 0.55) * height
        }
      }
    }

    function frame(now) {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      const t = now / 1000
      draw(dt, t, now)
      if (!reduced) raf = requestAnimationFrame(frame)
    }

    resize()
    window.addEventListener('resize', resize)
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="space-bg" aria-hidden="true" />
}