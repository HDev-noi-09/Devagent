import { clearIndex } from '../pineconeClient.js'
import { clearStore } from '../utils/projectStore.js'

const resetController = async (req, res) => {
  try {
    clearStore()
    await clearIndex()

    return res.status(200).json({ message: "Project reset successfully" })

  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

export { resetController }