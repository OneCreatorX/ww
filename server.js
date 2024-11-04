import express from 'express'
import fetch from 'node-fetch'

const app = express()
const port = process.env.PORT || 3000

const baseUrl = 'https://raw.githubusercontent.com/bjalalsjzbslalqoqueeyhskaambpqo/kajsbsba--hahsjsv-kakwbs_jaks_082hgg927hsksoLol-Noobbro9877272jshshsbsjsURLwww.noob.com.Obfuscate/refs/heads/main/'

async function getGithubContent(filename) {
  const response = await fetch(`${baseUrl}${filename}.lua`)
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Archivo no encontrado')
    }
    throw new Error('Error al obtener el contenido de GitHub')
  }
  return response.text()
}

app.get('/:filename', async (req, res) => {
  try {
    const content = await getGithubContent(req.params.filename)
    res.type('text/plain').send(content)
  } catch (error) {
    if (error.message === 'Archivo no encontrado') {
      res.status(404).send('El archivo que se intenta acceder no existe')
    } else {
      res.status(500).send('Error al obtener el contenido')
    }
  }
})

app.listen(port, () => {
  console.log(`Servidor ejecutándose en el puerto ${port}`)
})
