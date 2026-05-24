  import { Pinecone } from '@pinecone-database/pinecone'
  import dotenv from 'dotenv'
dotenv.config()
const { PINECONE_API_KEY, PINECONE_INDEX_NAME } = process.env

if (!PINECONE_API_KEY) {
  throw new Error("Missing PINECONE_API_KEY in environment variables")
}

if (!PINECONE_INDEX_NAME) {
  throw new Error("Missing PINECONE_INDEX_NAME in environment variables")
}

const pinecone = new Pinecone({
  apiKey: PINECONE_API_KEY,
})

const index = pinecone.index({ 
  name: PINECONE_INDEX_NAME
 })


const verifyConnection = async () => {
  try {
    const indexDescription = await pinecone.describeIndex(process.env.PINECONE_INDEX_NAME)
    console.log("Pinecone connected successfully ")
    return indexDescription
  } catch (error) {
    console.error("Pinecone connection failed ", error.message)
    throw new Error(`Pinecone connection failed: ${error.message}`)
  }
}

const clearIndex = async () => {
  try {
    await index.deleteAll()
    console.log("Pinecone index cleared ")
  } catch (error) {
    console.error("Failed to clear index ", error.message)
  }
}

export { index ,verifyConnection,clearIndex}
