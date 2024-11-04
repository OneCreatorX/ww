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
  const response = await fetch(`${baseUrl}${encodedFilename}.lua`)
  if (!response.ok) {
    console.error(`Error fetching ${filename}: ${response.status} ${response.statusText}`)
    throw new Error('Archivo no encontrado')
  }
  return response.text()
}

function generateDecoyCode() {
  return `print("Señuelo ${generateRandomCode(8)}")`
}

function splitContent(content, parts = 10) {
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

async function createRedirectChain(realContent) {
  const codes = Array(50).fill().map(() => generateRandomCode())
  const urls = codes.map(createTempUrl)
  
  for (let i = 0; i < 50; i++) {
    if (i === 30) {
      const contentParts = splitContent(realContent)
      const contentUrls = contentParts.map(() => createTempUrl(generateRandomCode()))
      contentParts.forEach((part, index) => {
        tempStorage.set(new URL(contentUrls[index]).pathname.slice(1), part)
        setTimeout(() => tempStorage.delete(new URL(contentUrls[index]).pathname.slice(1)), 2000)
      })
      tempStorage.set(codes[i], createLoader(contentUrls))
    } else if (i === 49) {
      tempStorage.set(codes[i], generateDecoyCode())
    } else {
      tempStorage.set(codes[i], `loadstring(game:HttpGet("${urls[i+1]}"))()`)
    }
    
    setTimeout(() => tempStorage.delete(codes[i]), 2000)
  }
  
  return urls[0]
}

function isRobloxRequest(req) {
  const userAgent = req.get('User-Agent')
  return userAgent && userAgent.includes('Roblox')
}

app.get('/:filename', async (req, res) => {
  if (!isRobloxRequest(req)) {
    return res.status(403).send('Acceso denegado')
  }

  try {
    const content = await getGithubContent(req.params.filename)
    const firstUrl = await createRedirectChain(content)
    res.send(`loadstring(game:HttpGet("${firstUrl}"))()`)
  } catch (error) {
    console.error(`Error en /:filename: ${error.message}`)
    res.status(404).send('Acceso denegado')
  }
})

app.get('/:code', (req, res) => {
  if (!isRobloxRequest(req)) {
    return res.status(403).send('Acceso denegado')
  }

  const content = tempStorage.get(req.params.code)
  if (content) {
    res.send(content)
  } else {
    res.status(403).send('Acceso denegado')
  }
})

app.use((req, res) => {
  res.status(404).send('Acceso denegado')
})

app.listen(port, () => {
  console.log(`Servidor ejecutándose en el puerto ${port}`)
})
