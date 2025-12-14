"use client"

import { useEffect, useRef } from "react"
import { useSearchParams, usePathname } from "next/navigation"
import { usePlayerStore } from "@/lib/store/player-store"
import { useRedditAPI } from "./use-reddit-api"

/**
 * Initialize app on mount
 * - Load from URL params
 * - Setup keyboard shortcuts
 * - Load saved state
 */
export function useInitializeApp() {
  const hasInitialized = useRef(false)
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { fetchFromSubreddits } = useRedditAPI()
  const {
    setSelectedSubreddits,
    selectedSubreddits,
    togglePlay,
    next,
    previous,
    setVolume,
    volume,
  } = usePlayerStore()

  // ==========================================
  // INITIALIZE FROM URL
  // ==========================================
  useEffect(() => {
    if (hasInitialized.current) return

    // Check path: /r/music+listentothis
    const pathMatch = pathname.match(/^\/r\/(.+)$/)
    if (pathMatch) {
      const subs = pathMatch[1]
        .split("+")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)

      if (subs.length > 0) {
        hasInitialized.current = true
        setSelectedSubreddits(subs)
        fetchFromSubreddits(subs)
        return
      }
    }

    // Check query: ?r=music+listentothis
    const rParam = searchParams.get("r")
    if (rParam) {
      const subs = rParam
        .split("+")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)

      if (subs.length > 0) {
        hasInitialized.current = true
        setSelectedSubreddits(subs)
        fetchFromSubreddits(subs)
        return
      }
    }

    // Use saved subreddits or default
    if (selectedSubreddits.length > 0) {
      hasInitialized.current = true
      fetchFromSubreddits(selectedSubreddits)
    } else {
      hasInitialized.current = true
      const defaultSubs = ["listentothis"]
      setSelectedSubreddits(defaultSubs)
      fetchFromSubreddits(defaultSubs)
    }
  }, []) // Run once on mount

  // ==========================================
  // KEYBOARD SHORTCUTS
  // ==========================================
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore if typing in input
      const target = e.target as HTMLElement
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return
      }

      // Space: Play/Pause
      if (e.code === "Space") {
        e.preventDefault()
        togglePlay()
        return
      }

      // Modifier key shortcuts
      const mod = e.ctrlKey || e.metaKey

      if (mod) {
        switch (e.code) {
          case "ArrowLeft":
            e.preventDefault()
            previous()
            break
          case "ArrowRight":
            e.preventDefault()
            next()
            break
          case "ArrowUp":
            e.preventDefault()
            setVolume(Math.min(100, volume + 10))
            break
          case "ArrowDown":
            e.preventDefault()
            setVolume(Math.max(0, volume - 10))
            break
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [togglePlay, next, previous, setVolume, volume])
}