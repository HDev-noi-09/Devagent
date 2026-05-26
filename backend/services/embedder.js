import dotenv from 'dotenv'

dotenv.config()

import { CohereClient } from "cohere-ai"

const {COHERE_API_KEY}=process.env
if(!COHERE_API_KEY){
    throw new Error("Invalid cohere api key!");
    
}
const cohere = new CohereClient({
  token: COHERE_API_KEY,
})

const BATCH_SIZE = 96

const embedChunks = async (chunks) => {
  const results = []


  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE)
    const texts = batch.map(chunk => chunk.content)

    const response = await cohere.embed({
      texts,
      model: "embed-english-v3.0",
      inputType: "search_document",
    })

    const embeddings = response.embeddings

    batch.forEach((chunk, index) => {
      results.push({
        id: `chunk_${i + index}_${Date.now()}`,
        values: embeddings[index],
        metadata: {
          filePath: chunk.metadata.filePath,
          filename: chunk.metadata.filename,
          content: chunk.content,
          chunkIndex: chunk.metadata.chunkIndex,
          chunkCount: chunk.metadata.chunkCount,
          language: chunk.metadata.language,
          startLine: chunk.metadata.startLine,
          endLine: chunk.metadata.endLine,
        }
      })
    })
  }

  return results
}

const embedQuery = async (query) => {
  const response = await cohere.embed({
    texts: [query],
    model: "embed-english-v3.0",
    inputType: "search_query",
  })

  return response.embeddings[0]
}

export { embedChunks ,embedQuery}
