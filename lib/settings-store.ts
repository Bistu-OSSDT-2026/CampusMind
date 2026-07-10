import fs from 'fs'
import path from 'path'

export interface Settings {
  firstWeekStartDate: string
}

const DATA_FILE = path.join(process.cwd(), 'data', 'settings.json')

const defaultSettings: Settings = {
  firstWeekStartDate: '2026-02-23',
}

let memorySettings: Settings = { ...defaultSettings }
let initialized = false

function ensureDataDir(): void {
  const dir = path.dirname(DATA_FILE)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function initializeSettings(): void {
  if (initialized) return
  
  ensureDataDir()
  
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8')
      memorySettings = { ...defaultSettings, ...JSON.parse(data) }
    } else {
      fs.writeFileSync(DATA_FILE, JSON.stringify(defaultSettings, null, 2))
    }
  } catch {
    memorySettings = { ...defaultSettings }
  }
  
  initialized = true
}

function saveSettings(): void {
  try {
    ensureDataDir()
    fs.writeFileSync(DATA_FILE, JSON.stringify(memorySettings, null, 2))
  } catch {}
}

export function getSettings(): Settings {
  initializeSettings()
  return { ...memorySettings }
}

export function updateSettings(updates: Partial<Settings>): Settings {
  initializeSettings()
  memorySettings = { ...memorySettings, ...updates }
  saveSettings()
  return { ...memorySettings }
}