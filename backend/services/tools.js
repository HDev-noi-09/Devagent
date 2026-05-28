import { embedQuery } from './embedder.js'
import { index } from '../pineconeClient.js'
import { getFileTree, getFileContents } from '../utils/projectStore.js'


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

export { searchCodebase, getFile, listFiles, findReferences }
