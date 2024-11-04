import express from 'express'
import fetch from 'node-fetch'
import crypto from 'crypto'
import rateLimit from 'express-rate-limit'

const app = express()
const port = process.env.PORT || 8080

const baseUrl = 'https://raw.githubusercontent.com/bjalalsjzbslalqoqueeyhskaambpqo/kajsbsba--hahsjsv-kakwbs_jaks_082hgg927hsksoLol-Noobbro9877272jshshsbsjsURLwww.noob.com.Obfuscate/refs/heads/main/'
const tempStorage = new Map()
const inProgressRequests = new Map()
const recentlyProcessedFiles = new Map()

app.set('trust proxy', 1)

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip
})

app.use(limiter)

function generateRandomCode(length = 32) {
  return crypto.randomBytes(length).toString('hex').slice(0, length)
}

function createTempUrl(code) {
  return `https://${process.env.RAILWAY_STATIC_URL || 'https://secur.api-x.site'}/${code}`
}

async function getGithubContent(filename) {
  const encodedFilename = encodeURIComponent(filename)
  try {
    const response = await fetch(`${baseUrl}${encodedFilename}.lua`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.text()
  } catch (error) {
    throw new Error('Archivo no encontrado')
  }
}

function splitContent(content, parts = 20) {
  const chunkSize = Math.ceil(content.length / parts)
  return Array(parts).fill().map((_, i) => content.slice(i * chunkSize, (i + 1) * chunkSize))
}

function createLoader(urls) {
  return `
    local parts = {}
    ${urls.map((url, i) => `parts[${i + 1}] = game:HttpGet("${url}")`).join('\n')}
    loadstring(table.concat(parts))()
  `
}

function isRobloxRequest(req) {
  const userAgent = req.get('User-Agent')
  return userAgent && userAgent.includes('Roblox')
}

function cleanupTempStorage() {
  const now = Date.now()
  for (const [key, value] of tempStorage.entries()) {
    if (now - value.timestamp > 60000) {
      tempStorage.delete(key)
    }
  }
}

function cleanupInProgressRequests() {
  const now = Date.now()
  for (const [key, value] of inProgressRequests.entries()) {
    if (now - value.timestamp > 30000) {
      inProgressRequests.delete(key)
    }
  }
}

function cleanupRecentlyProcessedFiles() {
  const now = Date.now()
  for (const [key, value] of recentlyProcessedFiles.entries()) {
    if (now - value.timestamp > 10000) {
      recentlyProcessedFiles.delete(key)
    }
  }
}

setInterval(cleanupTempStorage, 60000)
setInterval(cleanupInProgressRequests, 30000)
setInterval(cleanupRecentlyProcessedFiles, 10000)

function createNotificationScript() {
  return `
    local StarterGui = game:GetService("StarterGui")
    local function notify()
      StarterGui:SetCore("SendNotification", {
        Title = "Procesando",
        Text = "Se está procesando una solicitud anterior. Por favor, espere unos segundos.",
        Duration = 5
      })
    end
    notify()
  `
}

app.get('/:filename', async (req, res) => {
  if (!isRobloxRequest(req)) {
    return res.status(403).send('Acceso denegado')
  }

  const requestKey = `${req.ip}-${req.params.filename}`

  if (inProgressRequests.has(requestKey) || recentlyProcessedFiles.has(req.params.filename)) {
    return res.send(createNotificationScript())
  }

  if (tempStorage.has(req.params.filename)) {
    const { content, timestamp } = tempStorage.get(req.params.filename)
    if (Date.now() - timestamp <= 10000) {
      res.send(content)
    }
    tempStorage.delete(req.params.filename)
    return
  }

  try {
    inProgressRequests.set(requestKey, { timestamp: Date.now() })

    const content = await getGithubContent(req.params.filename)
    const contentParts = splitContent(content)
    const contentUrls = contentParts.map(() => createTempUrl(generateRandomCode()))
    
    contentParts.forEach((part, index) => {
      const partCode = new URL(contentUrls[index]).pathname.slice(1)
      tempStorage.set(partCode, { content: part, timestamp: Date.now() })
      setTimeout(() => tempStorage.delete(partCode), 8000)
    })
    
    const loader = createLoader(contentUrls)
    res.send(loader)

    inProgressRequests.delete(requestKey)
    recentlyProcessedFiles.set(req.params.filename, { timestamp: Date.now() })
  } catch (error) {
    inProgressRequests.delete(requestKey)
    res.status(404).send('Acceso denegado')
  }
})

app.use((req, res) => {
  res.status(404).send('Acceso denegado')
})

const server = app.listen(port, () => {
  console.log(`Servidor ejecutándose en el puerto ${port}`)
})

process.on('SIGTERM', () => {
  server.close(() => {
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  server.close(() => {
    process.exit(0)
  })
})
