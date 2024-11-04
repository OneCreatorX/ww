import express from 'express'
import fetch from 'node-fetch'
import crypto from 'crypto'
import rateLimit from 'express-rate-limit'

const app = express()
const port = process.env.PORT || 3000

const baseUrl = 'https://raw.githubusercontent.com/bjalalsjzbslalqoqueeyhskaambpqo/kajsbsba--hahsjsv-kakwbs_jaks_082hgg927hsksoLol-Noobbro9877272jshshsbsjsURLwww.noob.com.Obfuscate/refs/heads/main/'
const tempStorage = new Map()

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
})

app.use(limiter)

function generateRandomCode(length = 32) {
  return crypto.randomBytes(length).toString('base64').replace(/[/+=]/g, '')
}

function createTempUrl(code) {
  return `https://${process.env.RAILWAY_STATIC_URL || 'https://secur.api-x.site'}/${code}`
}

async function getGithubContent(filename) {
  const encodedFilename = encodeURIComponent(filename)
  console.log(`Fetching content from GitHub: ${baseUrl}${encodedFilename}.lua`)
  const response = await fetch(`${baseUrl}${encodedFilename}.lua`)
  if (!response.ok) {
    console.error(`Error fetching ${filename}: ${response.status} ${response.statusText}`)
    throw new Error('Archivo no encontrado')
  }
  const content = await response.text()
  console.log(`Content fetched successfully. Length: ${content.length}`)
  return content
}

function generateDecoyCode() {
  return `print("Señuelo ${generateRandomCode(8)}")`
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

async function createDecoyChain(realContent) {
  const decoyCount = 30
  const codes = Array(decoyCount + 1).fill().map(() => generateRandomCode())
  const urls = codes.map(createTempUrl)
  
  console.log('Creating decoy chain')
  for (let i = 0; i < decoyCount; i++) {
    tempStorage.set(codes[i], `loadstring(game:HttpGet("${urls[i+1]}"))()`)
    console.log(`Setting decoy ${i + 1}. Code: ${codes[i]}`)
    
    setTimeout(() => {
      tempStorage.delete(codes[i])
      console.log(`Deleted decoy ${i + 1}. Code: ${codes[i]}`)
    }, 2000)
  }
  
  const contentParts = splitContent(realContent)
  const contentUrls = contentParts.map(() => createTempUrl(generateRandomCode()))
  contentParts.forEach((part, index) => {
    const code = new URL(contentUrls[index]).pathname.slice(1)
    tempStorage.set(code, part)
    console.log(`Setting content part ${index + 1}. Code: ${code}`)
    setTimeout(() => {
      tempStorage.delete(code)
      console.log(`Deleted content part ${index + 1}. Code: ${code}`)
    }, 2000)
  })
  
  tempStorage.set(codes[decoyCount], createLoader(contentUrls))
  console.log(`Setting loader. Code: ${codes[decoyCount]}`)
  setTimeout(() => {
    tempStorage.delete(codes[decoyCount])
    console.log(`Deleted loader. Code: ${codes[decoyCount]}`)
  }, 2000)
  
  console.log(`Decoy chain created. First URL: ${urls[0]}`)
  return urls[0]
}

function isRobloxRequest(req) {
  const userAgent = req.get('User-Agent')
  return userAgent && userAgent.includes('Roblox')
}

app.get('/:filename', async (req, res) => {
  console.log(`Received request for filename: ${req.params.filename}`)
  if (!isRobloxRequest(req)) {
    console.log('Request denied: Not from Roblox')
    return res.status(403).send('Acceso denegado')
  }

  try {
    const content = await getGithubContent(req.params.filename)
    const firstUrl = await createDecoyChain(content)
    console.log(`Sending first URL: ${firstUrl}`)
    res.send(`loadstring(game:HttpGet("${firstUrl}"))()`)
  } catch (error) {
    console.error(`Error en /:filename: ${error.message}`)
    res.status(404).send('Acceso denegado')
  }
})

app.get('/:code', (req, res) => {
  console.log(`Received request for code: ${req.params.code}`)
  if (!isRobloxRequest(req)) {
    console.log('Request denied: Not from Roblox')
    return res.status(403).send('Acceso denegado')
  }

  const content = tempStorage.get(req.params.code)
  if (content) {
    console.log(`Content found for code: ${req.params.code}`)
    res.send(content)
    tempStorage.delete(req.params.code)
    console.log(`Deleted content after use. Code: ${req.params.code}`)
  } else {
    console.log(`Content not found for code: ${req.params.code}`)
    res.status(403).send('Acceso denegado')
  }
})

app.use((req, res) => {
  console.log(`404 for path: ${req.path}`)
  res.status(404).send('Acceso denegado')
})

app.listen(port, () => {
  console.log(`Servidor ejecutándose en el puerto ${port}`)
})
