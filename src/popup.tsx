"use client"

import { useEffect, useState } from "react"
import { openDB } from "idb"
import "~style.css"
import { initDB } from "./lib/idb"

function IndexPopup() {
  const [quoteDraft, setQuoteDraft] = useState("")
  const [newQuote, setNewQuote] = useState("")
  const [quotes, setQuotes] = useState<string[]>([])
  const [backgroundImages, setBackgroundImages] = useState<string[]>(["https://placehold.co/600x400.png"])
  const [displayedImages, setDisplayedImages] = useState<string[]>(["https://placehold.co/800x400.png"])
  const [settings, setSettings] = useState({
    backgroundMode: "random", // "random" or "daily"
    displayedMode: "random", // "random" or "daily"
    quotesMode: "random", // "random" or "daily"
  })

  useEffect(() => {
    ;(async () => {
      const db = await initDB()

      const q = await db.get("quotes", "main")
      if (q?.text) {
        setQuoteDraft(q.text)
        const quotesArray = q.text.split("\n").filter((quote) => quote.trim() !== "")
        setQuotes(quotesArray)
      }

      const tx = db.transaction("images", "readonly")
      const store = tx.objectStore("images")
      const allImages = await store.getAll()
      const dataUrls = allImages.map((img: any) => img.dataUrl).filter(Boolean)
      if (dataUrls.length > 0) {
        setBackgroundImages(dataUrls)
      } else {
        setBackgroundImages(["https://placehold.co/600x400.png"])
      }

      const displayedTx = db.transaction("displayedImages", "readonly")
      const displayedStore = displayedTx.objectStore("displayedImages")
      const allDisplayedImages = await displayedStore.getAll()
      const displayedDataUrls = allDisplayedImages.map((img: any) => img.dataUrl).filter(Boolean)
      if (displayedDataUrls.length > 0) {
        setDisplayedImages(displayedDataUrls)
      } else {
        setDisplayedImages(["https://placehold.co/800x400.png"])
      }

      const settingsData = await db.get("settings", "main")
      if (settingsData?.config) {
        setSettings(settingsData.config)
      }
    })()
  }, [])

  useEffect(() => {
    const id = setTimeout(async () => {
      const db = await initDB()
      await db.put("quotes", { id: "main", text: quoteDraft })
    }, 300)
    return () => clearTimeout(id)
  }, [quoteDraft])

  useEffect(() => {
    const id = setTimeout(async () => {
      const db = await initDB()
      await db.put("settings", { id: "main", config: settings })
    }, 300)
    return () => clearTimeout(id)
  }, [settings])

  const addQuote = () => {
    if (newQuote.trim()) {
      const updatedQuotes = [...quotes, newQuote.trim()]
      setQuotes(updatedQuotes)
      setQuoteDraft(updatedQuotes.join("\n"))
      setNewQuote("")
    }
  }

  const removeQuote = (index: number) => {
    const updatedQuotes = quotes.filter((_, i) => i !== index)
    setQuotes(updatedQuotes)
    setQuoteDraft(updatedQuotes.join("\n"))
  }

  const handleFile = async (file: File) => {
    const reader = new FileReader()
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string
      const db = await initDB()
      const id = Date.now().toString()
      await db.put("images", { id, dataUrl })
      setBackgroundImages((prev) => [...prev, dataUrl])
    }
    reader.readAsDataURL(file)
  }

  const handleDisplayedFile = async (file: File) => {
    const reader = new FileReader()
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string
      const db = await initDB()
      const id = Date.now().toString()
      await db.put("displayedImages", { id, dataUrl })
      setDisplayedImages((prev) => [...prev, dataUrl])
    }
    reader.readAsDataURL(file)
  }

  const removeBackgroundImage = async (index: number) => {
    if (backgroundImages.length <= 1) return

    const imageToRemove = backgroundImages[index]
    const updatedImages = backgroundImages.filter((_, i) => i !== index)
    setBackgroundImages(updatedImages)

    if (!imageToRemove.includes("placehold.co")) {
      const db = await initDB()
      const tx = db.transaction("images", "readwrite")
      const store = tx.objectStore("images")
      const allImages = await store.getAll()
      const imageToDelete = allImages.find((img: any) => img.dataUrl === imageToRemove)
      if (imageToDelete) {
        await store.delete(imageToDelete.id)
      }
    }
  }

  const removeDisplayedImage = async (index: number) => {
    if (displayedImages.length <= 1) return

    const imageToRemove = displayedImages[index]
    const updatedImages = displayedImages.filter((_, i) => i !== index)
    setDisplayedImages(updatedImages)

    if (!imageToRemove.includes("placehold.co")) {
      const db = await initDB()
      const tx = db.transaction("displayedImages", "readwrite")
      const store = tx.objectStore("displayedImages")
      const allImages = await store.getAll()
      const imageToDelete = allImages.find((img: any) => img.dataUrl === imageToRemove)
      if (imageToDelete) {
        await store.delete(imageToDelete.id)
      }
    }
  }

  const CustomSelect = ({
    value,
    onChange,
    options,
    label,
  }: {
    value: string
    onChange: (value: string) => void
    options: { value: string; label: string }[]
    label: string
  }) => (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-zinc-700">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white appearance-none cursor-pointer"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
          <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col w-80 p-6 bg-zinc-50 min-h-96 max-h-[600px] overflow-y-auto">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-blue-500 underline">
            <a href="https://github.com/velolib/xinde" target="_blank" rel="noopener noreferrer">xinde</a>
        </h1>
        <p className="text-sm text-zinc-600 mt-1">Extension Settings</p>
      </div>

      <div className="space-y-6 flex-1">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-zinc-800">Display Settings</h2>

          <CustomSelect
            value={settings.backgroundMode}
            onChange={(value) => setSettings((prev) => ({ ...prev, backgroundMode: value }))}
            options={[
              { value: "random", label: "Random each time" },
              { value: "daily", label: "Same throughout day" },
            ]}
            label="Background Images"
          />

          <CustomSelect
            value={settings.displayedMode}
            onChange={(value) => setSettings((prev) => ({ ...prev, displayedMode: value }))}
            options={[
              { value: "random", label: "Random each time" },
              { value: "daily", label: "Same throughout day" },
            ]}
            label="Displayed Images"
          />

          <CustomSelect
            value={settings.quotesMode}
            onChange={(value) => setSettings((prev) => ({ ...prev, quotesMode: value }))}
            options={[
              { value: "random", label: "Random each time" },
              { value: "daily", label: "Same throughout day" },
            ]}
            label="Quotes"
          />
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-semibold text-zinc-700">Quotes</label>

          {/* Add new quote input */}
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="Add a new quote..."
              value={newQuote}
              onChange={(e) => setNewQuote(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addQuote()}
            />
            <button
              onClick={addQuote}
              disabled={!newQuote.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
            >
              Add
            </button>
          </div>

          {/* Display existing quotes */}
          {quotes.length > 0 && (
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {quotes.map((quote, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-white rounded-lg border border-zinc-300 group"
                >
                  <span className="text-sm text-zinc-700 flex-1 mr-2 line-clamp-2">{quote}</span>
                  <button
                    onClick={() => removeQuote(index)}
                    className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 p-1 rounded transition-all"
                    title="Remove quote"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-semibold text-zinc-700">Background Images</label>

          {/* File input with better styling */}
          <div className="relative">
            <input
              type="file"
              accept="image/png, image/jpeg, image/gif, image/webp, image/svg+xml"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              multiple
              onChange={(e) => {
                for (const file of e.target.files || []) {
                  if (file) handleFile(file)
                }
              }}
            />
            <div className="flex items-center justify-center w-full p-4 border-2 border-dashed border-zinc-300 rounded-lg hover:border-blue-400 hover:bg-zinc-100 transition-colors cursor-pointer">
              <div className="text-center">
                <svg
                  className="w-6 h-6 text-zinc-400 mx-auto mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <p className="text-sm text-zinc-600">Click to add background image</p>
              </div>
            </div>
          </div>

          {/* Image preview grid with remove buttons */}
          <div className="grid grid-cols-2 gap-3">
            {backgroundImages.map((img, idx) => (
              <div key={idx} className="relative group">
                <img
                  src={img || "/placeholder.svg"}
                  alt={`Background ${idx + 1}`}
                  className="w-full h-20 object-cover rounded-lg border border-zinc-300"
                />
                {backgroundImages.length > 1 && (
                  <button
                    onClick={() => removeBackgroundImage(idx)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600"
                    title="Remove image"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          <p className="text-xs text-zinc-500 mt-2">At least one background image is required</p>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-semibold text-zinc-700">Displayed Images</label>

          {/* File input for displayed images */}
          <div className="relative">
            <input
              type="file"
              accept="image/png, image/jpeg, image/gif, image/webp, image/svg+xml"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              multiple
              onChange={(e) => {
                for (const file of e.target.files || []) {
                  if (file) handleDisplayedFile(file)
                }
              }}
            />
            <div className="flex items-center justify-center w-full p-4 border-2 border-dashed border-zinc-300 rounded-lg hover:border-blue-400 hover:bg-zinc-100 transition-colors cursor-pointer">
              <div className="text-center">
                <svg
                  className="w-6 h-6 text-zinc-400 mx-auto mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <p className="text-sm text-zinc-600">Click to add displayed image</p>
              </div>
            </div>
          </div>

          {/* Displayed images preview grid */}
          <div className="grid grid-cols-2 gap-3">
            {displayedImages.map((img, idx) => (
              <div key={idx} className="relative group">
                <img
                  src={img || "/placeholder.svg"}
                  alt={`Displayed ${idx + 1}`}
                  className="w-full h-20 object-cover rounded-lg border border-zinc-300"
                />
                {displayedImages.length > 1 && (
                  <button
                    onClick={() => removeDisplayedImage(idx)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600"
                    title="Remove image"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          <p className="text-xs text-zinc-500 mt-2">At least one displayed image is required</p>
        </div>
      </div>
    </div>
  )
}

export default IndexPopup
