'use client'

import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: (() => void) | undefined
  }
}

const YOUTUBE_VIDEO_ID = 'Yo0U0enyaPU'

export function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const playerRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let isMounted = true

    // Initialize YouTube Player
    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return

      try {
        playerRef.current = new window.YT.Player('yt-audio-player', {
          height: '1',
          width: '1',
          videoId: YOUTUBE_VIDEO_ID,
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            loop: 1,
            playlist: YOUTUBE_VIDEO_ID,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
          },
          events: {
            onReady: (event: any) => {
              if (!isMounted) return
              try {
                event.target.playVideo()
                setIsPlaying(true)
                setHasStarted(true)
              } catch (e) {
                console.log('Autoplay deferred until first user interaction', e)
              }
            },
            onStateChange: (event: any) => {
              if (!isMounted) return
              // YT.PlayerState.PLAYING is 1
              if (event.data === 1) {
                setIsPlaying(true)
                setHasStarted(true)
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

    // Browser Autoplay Policy Fallback:
    // If browser blocks unmuted sound before user gesture, play immediately on first click/tap anywhere
    const handleFirstGesture = () => {
      if (playerRef.current) {
        try {
          const state = playerRef.current.getPlayerState?.()
          if (state !== 1) {
            playerRef.current.playVideo?.()
            setIsPlaying(true)
            setHasStarted(true)
          }
        } catch {}
      }
    }

    window.addEventListener('click', handleFirstGesture, { once: true })
    window.addEventListener('touchstart', handleFirstGesture, { once: true })
    window.addEventListener('keydown', handleFirstGesture, { once: true })

    return () => {
      isMounted = false
      window.removeEventListener('click', handleFirstGesture)
      window.removeEventListener('touchstart', handleFirstGesture)
      window.removeEventListener('keydown', handleFirstGesture)
      try {
        playerRef.current?.destroy?.()
      } catch {}
    }
  }, [])

  const togglePlay = () => {
    if (!playerRef.current) return
    try {
      if (isPlaying) {
        playerRef.current.pauseVideo()
        setIsPlaying(false)
      } else {
        playerRef.current.playVideo()
        setIsPlaying(true)
        setHasStarted(true)
      }
    } catch {}
  }

  const toggleMute = () => {
    if (!playerRef.current) return
    try {
      if (isMuted) {
        playerRef.current.unMute()
        setIsMuted(false)
      } else {
        playerRef.current.mute()
        setIsMuted(true)
      }
    } catch {}
  }

  return (
    <>
      {/* Hidden YouTube Audio IFrame */}
      <div
        ref={containerRef}
        style={{
          position: 'fixed',
          top: -9999,
          left: -9999,
          width: 1,
          height: 1,
          opacity: 0,
          pointerEvents: 'none',
        }}
      >
        <div id="yt-audio-player" />
      </div>

      {/* Modern Floating Music Widget */}
      <div className="music-pill-widget" aria-label="Audio player controls">
        <button
          type="button"
          onClick={togglePlay}
          className={`music-pill-btn ${isPlaying ? 'is-playing' : ''}`}
          title={isPlaying ? 'Pause UDAYS Anthem' : 'Play UDAYS Anthem'}
        >
          {/* Animated sound equalizer bars */}
          <span className="sound-wave-bars" aria-hidden="true">
            <span className={`wave-bar ${isPlaying ? 'animating' : ''}`} />
            <span className={`wave-bar ${isPlaying ? 'animating' : ''}`} />
            <span className={`wave-bar ${isPlaying ? 'animating' : ''}`} />
          </span>

          <span className="music-pill-text">
            {isPlaying ? 'UDAYS Anthem ⚓' : 'Play Anthem ▶'}
          </span>
        </button>

        {isPlaying && (
          <button
            type="button"
            onClick={toggleMute}
            className="music-mute-btn"
            title={isMuted ? 'Unmute audio' : 'Mute audio'}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        )}
      </div>
    </>
  )
}
