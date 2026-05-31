import { agentLoop } from '../services/agentLoop.js'
import { getFileTree, getFileContents } from '../utils/projectStore.js'
const chatController = async (req, res) => {
  try {
    const { question, history ,mode} = req.body
        console.log("fileTree:", getFileTree())

    console.log("fileContents keys:", Object.keys(getFileContents()))

    if (!question || typeof question !== 'string' || question.trim() === '') {
      return res.status(400).json({ error: "Question is required" })
    }

     const agentMode = mode === "learning" ? "learning" : "agent"

    const chatHistory = Array.isArray(history) ? history : []

    const answer = await agentLoop(question.trim(), chatHistory,agentMode)

    return res.status(200).json({ answer })

  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

export { chatController }