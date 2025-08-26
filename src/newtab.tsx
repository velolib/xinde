"use client"

import { useState, useEffect } from "react"
import "~style.css"
import { initDB } from "./lib/idb"
import placeholderImage from "data-base64:~assets/placeholder.svg"

const getDayBasedIndex = (arrayLength: number, seed = ""): number => {
  const today = new Date().toDateString() + seed
  let hash = 0
  for (let i = 0; i < today.length; i++) {
    const char = today.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash) % arrayLength
}

export default function NewTabPage() {
  const [currentTime, setCurrentTime] = useState("")
  const [currentDate, setCurrentDate] = useState("")
  const [quote, setQuote] = useState("Welcome to xinde!")
  const [backgroundImage, setBackgroundImage] = useState(placeholderImage)
  const [displayedImage, setDisplayedImage] = useState(placeholderImage)

  // ---- Load quotes, background images, displayed images, and settings from IndexedDB ----
  useEffect(() => {
    (async () => {
      const db = await initDB()

      const settingsData = await db.get("settings", "main")
      const settings = settingsData?.config || {
        backgroundMode: "random",
        displayedMode: "random",
        quotesMode: "random",
      }

      // load quotes
      const q = await db.get("quotes", "main")
      if (q?.text) {
        const lines = q.text.split("\n").filter((l: string) => l.trim())
        if (lines.length > 0) {
          const quoteIndex =
            settings.quotesMode === "daily"
              ? getDayBasedIndex(lines.length, "quote")
              : Math.floor(Math.random() * lines.length)
          setQuote(lines[quoteIndex])
        }
      }

      // load all background images
      const tx = db.transaction("images", "readonly")
      const store = tx.objectStore("images")
      const allImages = await store.getAll()
      const dataUrls = allImages.map((img: any) => img.dataUrl).filter(Boolean)

      if (dataUrls.length > 0) {
        const bgIndex =
          settings.backgroundMode === "daily"
            ? getDayBasedIndex(dataUrls.length, "background")
            : Math.floor(Math.random() * dataUrls.length)
        setBackgroundImage(dataUrls[bgIndex])
      }

      const displayedTx = db.transaction("displayedImages", "readonly")
      const displayedStore = displayedTx.objectStore("displayedImages")
      const allDisplayedImages = await displayedStore.getAll()
      const displayedDataUrls = allDisplayedImages.map((img: any) => img.dataUrl).filter(Boolean)

      if (displayedDataUrls.length > 0) {
        // Use settings to determine displayed image selection
        const displayedIndex =
          settings.displayedMode === "daily"
            ? getDayBasedIndex(displayedDataUrls.length, "displayed")
            : Math.floor(Math.random() * displayedDataUrls.length)
        setDisplayedImage(displayedDataUrls[displayedIndex])
      }
    })()
  }, [])

  // ---- Clock updater ----
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      )
      setCurrentDate(
        now.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      )
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div
      className="flex h-screen w-screen items-center justify-center min-h-0 relative overflow-hidden bg-black"
      style={{
        backgroundImage: `url('${backgroundImage}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="overlay" />
      <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/30"></div>

      {/* Content Container */}
      <div className="flex w-full h-full relative z-10 gap-8 p-8">
        {/* Left Side - Time and Quote */}
        <div className="flex flex-col items-center justify-center flex-[0.3]">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20 max-w-lg w-full relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>

            <div className="relative z-10">
              {/* Time Display */}
              <div className="mb-6">
                <h1 className="text-5xl font-bold text-white mb-3 font-mono tracking-wide text-center drop-shadow-lg">
                  {currentTime}
                </h1>
                <p className="text-lg text-white font-medium text-center drop-shadow-md">{currentDate}</p>
              </div>

              {/* Quote */}
              <div className="border-t border-white/20 pt-6">
                <p className="text-base text-white italic leading-relaxed text-center drop-shadow-md">"{quote}"</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Displayed Image */}
        <div className="flex items-center justify-center flex-[0.7]">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 shadow-2xl border border-white/20 w-full relative overflow-hidden size-full">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none size-full"></div>

            <div className="relative z-10 size-full border border-white/20 rounded-xl">
              <img
                src={displayedImage || placeholderImage}
                alt="Featured image"
                className="w-full h-full object-cover rounded-xl shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
