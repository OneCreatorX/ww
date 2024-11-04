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
  const response = await fetch(`${baseUrl}${encodedFilename}.lua`)
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  return await response.text()
}

function splitContent(content, parts = 50) {
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

function encryptContent(content, key) {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv)
  let encrypted = cipher.update(content)
  encrypted = Buffer.concat([encrypted, cipher.final()])
  return iv.toString('hex') + ':' + encrypted.toString('hex')
}

function decryptContent(content, key) {
  const parts = content.split(':')
  const iv = Buffer.from(parts.shift(), 'hex')
  const encryptedText = Buffer.from(parts.join(':'), 'hex')
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv)
  let decrypted = decipher.update(encryptedText)
  decrypted = Buffer.concat([decrypted, decipher.final()])
  return decrypted.toString()
}

app.get('/:filename', async (req, res) => {
  if (!isRobloxRequest(req)) {
    return res.status(403).send('Acceso denegado')
  }

  const encryptionKey = crypto.randomBytes(32).toString('hex')

  if (tempStorage.has(req.params.filename)) {
    const encryptedContent = tempStorage.get(req.params.filename)
    const content = decryptContent(encryptedContent, encryptionKey)
    res.send(content)
    tempStorage.delete(req.params.filename)
    return
  }

  try {
    const content = await getGithubContent(req.params.filename)
    const contentParts = splitContent(content)
    const contentUrls = contentParts.map(() => createTempUrl(generateRandomCode()))
    
    contentParts.forEach((part, index) => {
      const partCode = new URL(contentUrls[index]).pathname.slice(1)
      const encryptedPart = encryptContent(part, encryptionKey)
      tempStorage.set(partCode, encryptedPart)
      setTimeout(() => tempStorage.delete(partCode), 10000)
    })
    
    const loader = createLoader(contentUrls)
    res.send(loader)
  } catch (error) {
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
