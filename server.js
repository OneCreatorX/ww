import express from 'express'
import fetch from 'node-fetch'
import crypto from 'crypto'
import rateLimit from 'express-rate-limit'

const app = express()
const port = process.env.PORT || 8080

const baseUrl = 'https://raw.githubusercontent.com/bjalalsjzbslalqoqueeyhskaambpqo/kajsbsba--hahsjsv-kakwbs_jaks_082hgg927hsksoLol-Noobbro9877272jshshsbsjsURLwww.noob.com.Obfuscate/refs/heads/main/'
const tempStorage = new Map()
const userTasks = new Map()

// Configurar Express para confiar en el proxy
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
  return `https://${process.env.RAILWAY_STATIC_URL || 'localhost:8080'}/${code}`
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

async function createNextCheckpoint(userIp, step, totalSteps, content) {
  const code = generateRandomCode()
  const url = createTempUrl(code)
  
  if (step < totalSteps - 1) {
    tempStorage.set(code, `loadstring(game:HttpGet("${createTempUrl(generateRandomCode())}"))()`)
  } else {
    const contentParts = splitContent(content)
    const contentUrls = contentParts.map(() => createTempUrl(generateRandomCode()))
    contentParts.forEach((part, index) => {
      const partCode = new URL(contentUrls[index]).pathname.slice(1)
      tempStorage.set(partCode, part)
      setTimeout(() => tempStorage.delete(partCode), 10000)
    })
    tempStorage.set(code, createLoader(contentUrls))
  }
  
  setTimeout(() => tempStorage.delete(code), 10000)
  
  userTasks.get(userIp).currentStep = step + 1
  return url
}

function isRobloxRequest(req) {
  const userAgent = req.get('User-Agent')
  return userAgent && userAgent.includes('Roblox')
}

app.get('/:filename', async (req, res) => {
  const userIp = req.ip
  console.log(`Received request for filename: ${req.params.filename} from IP: ${userIp}`)
  
  if (!isRobloxRequest(req)) {
    console.log('Request denied: Not from Roblox')
    return res.status(403).send('Acceso denegado')
  }

  if (!userTasks.has(userIp)) {
    try {
      const content = await getGithubContent(req.params.filename)
      const totalSteps = 10 // Adjust as needed
      userTasks.set(userIp, { content, totalSteps, currentStep: 0 })
    } catch (error) {
      console.error(`Error en /:filename: ${error.message}`)
      return res.status(404).send('Acceso denegado')
    }
  }

  const userTask = userTasks.get(userIp)
  
  if (userTask.currentStep >= userTask.totalSteps) {
    userTasks.delete(userIp)
    return res.status(404).send('Acceso denegado')
  }

  const nextUrl = await createNextCheckpoint(userIp, userTask.currentStep, userTask.totalSteps, userTask.content)
  console.log(`Sending next URL: ${nextUrl}`)
  res.send(`loadstring(game:HttpGet("${nextUrl}"))()`)
})

app.get('/:code', (req, res) => {
  const content = tempStorage.get(req.params.code)
  if (content) {
    console.log(`Content found for code: ${req.params.code}`)
    res.send(content)
  } else {
    console.log(`Content not found for code: ${req.params.code}`)
    res.status(404).send('Acceso denegado')
  }
})

app.use((req, res) => {
  console.log(`404 for path: ${req.path}`)
  res.status(404).send('Acceso denegado')
})

app.listen(port, () => {
  console.log(`Servidor ejecutándose en el puerto ${port}`)
})
