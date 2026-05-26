import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters"

const LANGUAGE_MAP = {
  ".js": "js",
  ".jsx": "js",
  ".ts": "ts",
  ".tsx": "ts",
  ".py": "python",
  ".html": "html",
  ".css": "css",
  ".json":"json",
  ".md":"markdown",
  ".scss":"css"
}

const getFilename = (filePath) => {
  const parts = filePath.split(/[\\/]/)
  return parts[parts.length - 1]
}

const getLineNumber = (content, charIndex) => {
  return content.slice(0, charIndex).split(/\r\n|\r|\n/).length
}

const getChunkLineRange = (fileContent, chunk, searchStart) => {
  const startIndex = fileContent.indexOf(chunk, searchStart)

  if (startIndex === -1) {
    return {
      startLine: null,
      endLine: null,
      nextSearchStart: searchStart,
    }
  }

  const endIndex = startIndex + chunk.length

  return {
    startLine: getLineNumber(fileContent, startIndex),
    endLine: getLineNumber(fileContent, endIndex),
    nextSearchStart: startIndex + 1,
  }
}

const chunkFile = async (filePath, fileContent) => {
  const ext = filePath.slice(filePath.lastIndexOf(".")).toLowerCase()
  const language = LANGUAGE_MAP[ext]
  const filename = getFilename(filePath)

  let splitter

  if (language) {
    splitter = RecursiveCharacterTextSplitter.fromLanguage(language, {
      chunkSize: 1000,
      chunkOverlap: 200,
    })
  } else {
    splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    })
  }

  const chunks = await splitter.splitText(fileContent)
  const filteredChunks = chunks.filter(chunk => chunk.trim().length > 0)
  const chunkCount = filteredChunks.length
  let searchStart = 0

  return filteredChunks.map((chunk, index) => {
    const lineRange = getChunkLineRange(fileContent, chunk, searchStart)
    searchStart = lineRange.nextSearchStart

    return {
      content: chunk,
      metadata: {
        filePath,
        filename,
        chunkIndex: index,
        chunkCount,
        language: language || "unknown",
        startLine: lineRange.startLine,
        endLine: lineRange.endLine,
      }
    }
  })
}

export { chunkFile }
