'use client'

import { useEffect, useRef } from 'react'

interface ConfettiParticle {
  x: number
  y: number
  w: number
  h: number
  color: string
  shape: 'rect' | 'circle'
  speedY: number
  speedX: number
  tilt: number
  tiltAngle: number
  tiltSpeed: number
  rotation: number
  rotationSpeed: number
  opacity: number
}

const PALETTE = [
  '#FFD700', // Gold
  '#F59E0B', // Amber
  '#FDE047', // Light Gold
  '#1686B8', // Urian Blue
  '#38BDF8', // Sky Blue
  '#60A5FA', // Blue Light
  '#E66723', // CEnTech Orange
  '#D62828', // CCJE Red
  '#228B38', // CAS Green
  '#7B38B8', // CITEC Purple
  '#E2E8F0', // Silver / CoN
  '#FFFFFF', // Bright White
]

export function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }

    window.addEventListener('resize', handleResize)

    // Generate confetti particle
    const createParticle = (initial = false): ConfettiParticle => {
      const isCircle = Math.random() < 0.25
      const sizeBase = Math.random() * 6 + 6

      return {
        x: Math.random() * width,
        // When initial is true, spread across top and upper portion so it's instantly falling
        y: initial ? Math.random() * height * 0.9 : -20 - Math.random() * 40,
        w: sizeBase,
        h: isCircle ? sizeBase : sizeBase * (1.2 + Math.random() * 0.8),
        color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        shape: isCircle ? 'circle' : 'rect',
        speedY: Math.random() * 2.2 + 1.6,
        speedX: (Math.random() - 0.5) * 1.5,
        tilt: Math.random() * 10 - 10,
        tiltAngle: Math.random() * Math.PI * 2,
        tiltSpeed: Math.random() * 0.07 + 0.03,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 4,
        opacity: Math.random() * 0.25 + 0.75,
      }
    }

    // Number of particles for nonstop festive celebration
    const PARTICLE_COUNT = 75
    const particles: ConfettiParticle[] = Array.from({ length: PARTICLE_COUNT }, () =>
      createParticle(true),
    )

    let windOffset = 0

    const render = () => {
      ctx.clearRect(0, 0, width, height)
      windOffset += 0.015

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]

        p.tiltAngle += p.tiltSpeed
        p.rotation += p.rotationSpeed
        p.y += p.speedY
        p.x += p.speedX + Math.sin(windOffset + i) * 0.6
        p.tilt = Math.sin(p.tiltAngle) * 12

        // Nonstop looping: When a particle falls past the bottom, recycle to top
        if (p.y > height + 25 || p.x < -30 || p.x > width + 30) {
          particles[i] = createParticle(false)
          particles[i].x = Math.random() * width
          particles[i].y = -20 - Math.random() * 30
        }

        ctx.save()
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.opacity
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rotation * Math.PI) / 180)

        // 3D flutter effect using cosine scaling
        const scaleX = Math.cos(p.tiltAngle)

        if (p.shape === 'circle') {
          ctx.beginPath()
          ctx.ellipse(0, 0, Math.max(1, Math.abs(p.w * scaleX) / 2), p.w / 2, 0, 0, Math.PI * 2)
          ctx.fill()
        } else {
          ctx.fillRect(-Math.abs(p.w * scaleX) / 2, -p.h / 2, Math.abs(p.w * scaleX), p.h)
        }

        ctx.restore()
      }

      animationId = requestAnimationFrame(render)
    }

    animationId = requestAnimationFrame(render)

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-50 w-full h-full"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 999,
      }}
    />
  )
}
