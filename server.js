import express from 'express'
import fetch from 'node-fetch'
import crypto from 'crypto'
import rateLimit from 'express-rate-limit'

const app = express()
const port = process.env.PORT || 8080

const baseUrl = 'https://raw.githubusercontent.com/bjalalsjzbslalqoqueeyhskaambpqo/kajsbsba--hahsjsv-kakwbs_jaks_082hgg927hsksoLol-Noobbro9877272jshshsbsjsURLwww.noob.com.Obfuscate/refs/heads/main/'
const tempStorage = new Map()

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
  console.log(`Fetching content from GitHub: ${baseUrl}${encodedFilename}.lua`)
  try {
    const response = await fetch(`${baseUrl}${encodedFilename}.lua`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const content = await response.text()
    console.log(`Content fetched successfully. Length: ${content.length}`)
    return content
  } catch (error) {
    console.error(`Error fetching ${filename}: ${error.message}`)
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

app.get('/:filename', async (req, res) => {
  console.log(`Received request for filename: ${req.params.filename} from IP: ${req.ip}`)
  
  if (!isRobloxRequest(req)) {
    console.log('Request denied: Not from Roblox')
    return res.status(403).send('Acceso denegado')
  }

  // Check if the request is for a content part
  if (tempStorage.has(req.params.filename)) {
    const content = tempStorage.get(req.params.filename)
    console.log(`Content part found for code: ${req.params.filename}`)
    res.send(content)
    tempStorage.delete(req.params.filename) // Remove after sending
    return
  }

  try {
    const content = await getGithubContent(req.params.filename)
    const contentParts = splitContent(content)
    const contentUrls = contentParts.map(() => createTempUrl(generateRandomCode()))
    
    contentParts.forEach((part, index) => {
      const partCode = new URL(contentUrls[index]).pathname.slice(1)
      tempStorage.set(partCode, part)
      setTimeout(() => tempStorage.delete(partCode), 5000) // 60 segundos de tiempo de vida
    })
    
    const loader = createLoader(contentUrls)
    console.log(`Sending loader with ${contentUrls.length} parts`)
    res.send(loader)
  } catch (error) {
    console.error(`Error en /:filename: ${error.message}`)
    res.status(404).send('Acceso denegado')
  }
})

app.use((req, res) => {
  console.log(`404 for path: ${req.path}`)
  res.status(404).send('Acceso denegado')
})

const server = app.listen(port, () => {
  console.log(`Servidor ejecutándose en el puerto ${port}`)
})

// Manejo de señales de terminación
process.on('SIGTERM', () => {
  console.log('Recibida señal SIGTERM. Cerrando el servidor...')
  server.close(() => {
    console.log('Servidor cerrado.')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('Recibida señal SIGINT. Cerrando el servidor...')
  server.close(() => {
    console.log('Servidor cerrado.')
    process.exit(0)
  })
})
