'use client'

import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: (() => void) | undefined
  }
}

const YOUTUBE_VIDEO_ID = 'Yo0U0enyaPU'
const START_SECONDS = 30

export function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const playerRef = useRef<any>(null)
  const hasSeekedRef = useRef(false)

  useEffect(() => {
    let isMounted = true

    const startPlayback = (player: any) => {
      if (!player) return
      try {
        if (!hasSeekedRef.current) {
          player.seekTo?.(START_SECONDS, true)
          hasSeekedRef.current = true
        }
        player.unMute?.()
        player.playVideo?.()
      } catch (err) {
        console.log('Autoplay attempt:', err)
      }
    }

    // Initialize YouTube Player attached to the rendered iframe
    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return

      try {
        playerRef.current = new window.YT.Player('yt-audio-player', {
          events: {
            onReady: (event: any) => {
              if (!isMounted) return
              startPlayback(event.target)
            },
            onStateChange: (event: any) => {
              if (!isMounted) return
              // YT.PlayerState.PLAYING is 1
              if (event.data === 1) {
                setIsPlaying(true)
              } else if (event.data === 2) {
                // PAUSED
                setIsPlaying(false)
              }
            },
          },
        })
      } catch (err) {
        console.error('YT Player initialization error:', err)
      }
    }

    // Load YouTube IFrame Player API code asynchronously
    if (!window.YT) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag)
      window.onYouTubeIframeAPIReady = () => {
        initPlayer()
      }
    } else {
      initPlayer()
    }

    // Fast-trigger fallback on ANY initial user interaction (click, scroll, tap, keypress)
    const triggerAudioOnGesture = () => {
      if (playerRef.current) {
        try {
          const state = playerRef.current.getPlayerState?.()
          if (state !== 1) {
            startPlayback(playerRef.current)
            setIsPlaying(true)
          }
        } catch {}
      }
    }

    const events = ['pointerdown', 'touchstart', 'click', 'keydown', 'scroll', 'wheel']
    for (const ev of events) {
      window.addEventListener(ev, triggerAudioOnGesture, { once: true, passive: true })
    }

    return () => {
      isMounted = false
      for (const ev of events) {
        window.removeEventListener(ev, triggerAudioOnGesture)
      }
      try {
        playerRef.current?.destroy?.()
      } catch {}
    }
  }, [])

  const handleToggle = () => {
    if (!playerRef.current) return
    try {
      if (!isPlaying) {
        if (!hasSeekedRef.current) {
          playerRef.current.seekTo?.(START_SECONDS, true)
          hasSeekedRef.current = true
        }
        playerRef.current.unMute?.()
        playerRef.current.playVideo?.()
        setIsPlaying(true)
        setIsMuted(false)
        return
      }

      if (isMuted) {
        playerRef.current.unMute?.()
        setIsMuted(false)
      } else {
        playerRef.current.mute?.()
        setIsMuted(true)
      }
    } catch {}
  }

  const isMusicActive = isPlaying && !isMuted

  return (
    <>
      {/* In-viewport invisible iframe with allow="autoplay" for maximum browser compatibility */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          right: 0,
          width: '240px',
          height: '180px',
          opacity: 0.001,
          pointerEvents: 'none',
          zIndex: -1,
          overflow: 'hidden',
        }}
        aria-hidden="true"
      >
        <iframe
          id="yt-audio-player"
          width="240"
          height="180"
          src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?enablejsapi=1&autoplay=1&start=${START_SECONDS}&loop=1&playlist=${YOUTUBE_VIDEO_ID}&playsinline=1`}
          title="Audio Player"
          allow="autoplay; encrypted-media"
          style={{ border: 0 }}
        />
      </div>

      {/* Floating Music Toggle: Moving Music Icon + Mute */}
      <div className="music-pill-widget" aria-label="Audio controls">
        <button
          type="button"
          onClick={handleToggle}
          className={`music-pill-btn ${isMusicActive ? 'is-playing' : 'is-muted'}`}
          title={isMuted ? 'Unmute music' : 'Mute music'}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {/* Animated moving sound wave music bars */}
          <span className="sound-wave-bars" aria-hidden="true">
            <span className={`wave-bar ${isMusicActive ? 'animating' : ''}`} />
            <span className={`wave-bar ${isMusicActive ? 'animating' : ''}`} />
            <span className={`wave-bar ${isMusicActive ? 'animating' : ''}`} />
            <span className={`wave-bar ${isMusicActive ? 'animating' : ''}`} />
          </span>

          <span className="music-pill-text">
            {isMuted ? 'Unmute' : 'Mute'}
          </span>
        </button>
      </div>
    </>
  )
}
