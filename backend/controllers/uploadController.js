import fs from 'fs'
import path from 'path'
import AdmZip from 'adm-zip'
import { shouldProcessFile } from '../services/fileFilter.js'
import { chunkFile } from '../services/chunker.js'
import { embedChunks } from '../services/embedder.js'
import { index } from '../pineconeClient.js'
import { setFile, clearStore, getFileTree } from '../utils/projectStore.js'
const uploadController = async (req, res) => {
     console.log("req.file:", req.file)
   console.log("req.body:", req.body)
  try {

  
    if (!req.file) {
      return res.status(400).json({ error: "No ZIP file uploaded" })
    }

    clearStore()
    try{
    await index.deleteAll()
    }catch(error){
      console.error("Something went wrong",error.message)
    };
    
    const zip = new AdmZip(req.file.path)
    const zipEntries = zip.getEntries()

 
    let allChunks = []

    for (const entry of zipEntries) {
  
      if (entry.isDirectory) continue

      const filePath = entry.entryName

      
      if (!shouldProcessFile(filePath)) continue

    
      const content = entry.getData().toString('utf-8')

      if (!content.trim() || content.split('\n').length < 3) continue

      setFile(filePath, content)

      const chunks = await chunkFile(filePath, content)
      allChunks = [...allChunks, ...chunks]
    }

    if (allChunks.length === 0) {
      fs.unlinkSync(req.file.path)
      return res.status(400).json({ error: "No valid files found in ZIP" })
    }


    const vectors = await embedChunks(allChunks)


    await index.upsert({records:vectors})

    fs.unlinkSync(req.file.path)
    

    return res.status(200).json({
      message: "Project uploaded successfully",
      totalFiles: getFileTree().length,
      totalChunks: allChunks.length,
      totalVectors: vectors.length,
    })

  } catch (error) {
    
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path)
    }
    return res.status(500).json({ error: error.message })
  }
}

export { uploadController }