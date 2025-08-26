import { openDB } from 'idb'

export const initDB = async () =>
  openDB("xinde-db", 2, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("quotes")) {
        db.createObjectStore("quotes", { keyPath: "id" })
      }
      if (!db.objectStoreNames.contains("images")) {
        db.createObjectStore("images", { keyPath: "id" })
      }
      if (!db.objectStoreNames.contains("displayedImages")) {
        db.createObjectStore("displayedImages", { keyPath: "id" })
      }
      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "id" })
      }
    },
  })