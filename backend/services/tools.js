import { embedQuery } from './embedder.js'
import { index } from '../pineconeClient.js'
import { getFileTree, getFileContents } from '../utils/projectStore.js'
import { fetchDocs } from './docsFetcher.js'
import OpenAI from 'openai'
const searchCodebase = async (query) => {
     if (!query || typeof query !== 'string') {
    throw new Error("search_codebase requires a valid query string")
  }
  const queryVector = await embedQuery(query)

  const results = await index.query({
    vector: queryVector,
    topK: 5,
    includeMetadata: true,
  })

  if (!results.matches || results.matches.length === 0){
        return { results :[],message:"No valid matches found"}
   
  }

  return results.matches.map(match => ({
    filePath: match.metadata.filePath,
    content: match.metadata.content,
    filename:match.metadata.filename,
    startLine: match.metadata.startLine,
    endLine: match.metadata.endLine,
    language: match.metadata.language,
    score: match.score,
  }))
}

const getFile = (filePath) => {
      if (!filePath || typeof filePath !== 'string') {
    throw new Error("get_file requires a valid file path string")
  }

  const fileContents = getFileContents()
  

  if (!fileContents[filePath]) {
    return `File not found: ${filePath}`
  }

  return {
    filePath,
    content: fileContents[filePath],
  }
}

const listFiles = () => {

    const fileTree = getFileTree()
  if (fileTree.length === 0) {
    throw new Error("No files found — make sure a project is uploaded")
  }


  return fileTree
}

const findReferences = (name) => {

     if (!name || typeof name !== 'string') {
    throw new Error("find_references requires a valid function or variable name")
  }
  const fileContents = getFileContents()
  const results = []

  for (const [filePath, content] of Object.entries(fileContents)) {
    const lines = content.split('\n')
    const matchingLines = []

    lines.forEach((line, index) => {
      if (line.includes(name)) {
        matchingLines.push({
          lineNumber: index + 1,
          line: line.trim(),
        })
      }
    })

    if (matchingLines.length > 0) {
      results.push({
        filePath,
        matches: matchingLines,
      })
    }
  }

  if (results.length === 0) {
    return {results :[],message:"Valid references not found"}
  }

  return results
}

const searchByFilename = (pattern) => {
  if (!pattern || typeof pattern !== 'string') {
    throw new Error("search_by_filename requires a valid pattern string")
  }

  const fileTree = getFileTree()

  if (fileTree.length === 0) {
    throw new Error("No project uploaded yet")
  }

  const normalizedPattern = pattern.toLowerCase()

  const matches = fileTree.filter(filePath =>
    filePath.toLowerCase().includes(normalizedPattern)
  )

  if (matches.length === 0) {
    return { results: [], message: "No files found matching pattern" }
  }
return matches
 
}

const suggestFix = async (filePath, bugDescription) => {
  if (!filePath || typeof filePath !== 'string') {
    throw new Error("suggest_fix requires a valid file path")
  }

  if (!bugDescription || typeof bugDescription !== 'string') {
    throw new Error("suggest_fix requires a valid bug description")
  }

  const fileContents = getFileContents()

  if (!fileContents[filePath]) {
    throw new Error(`File not found: ${filePath}`)
  }

  const fileContent = fileContents[filePath]

const groq=new OpenAI({
  apiKey:process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
})



  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: `You are a code fix generator.
Given buggy code and a bug description, return ONLY a valid JSON object with this exact structure:
{
  "before": "the buggy code snippet",
  "after": "the fixed code snippet",
  "explanation": "one line explanation of the fix"
}
Return nothing else. No markdown, no backticks, just the JSON object.`
      },
      {
        role: "user",
        content: `File: ${filePath}
Bug: ${bugDescription}
Code:
${fileContent}`
      }
    ],
    max_tokens: 1024,
  })

  const rawResponse = response.choices[0].message.content.trim()

  try {
    return JSON.parse(rawResponse)
  } catch {
    throw new Error("Failed to parse fix suggestion from LLM")
  }
}

const fetchDocsForTool = async (technology, query) => {
  if (!technology || typeof technology !== 'string') {
    throw new Error("fetch_docs requires a valid technology name")
  }

  if (!query || typeof query !== 'string') {
    throw new Error("fetch_docs requires a valid search query")
  }

  return await fetchDocs(technology, query)
}

export { searchCodebase, getFile, listFiles, findReferences,fetchDocsForTool,suggestFix,searchByFilename}
