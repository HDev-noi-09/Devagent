const DEVDOCS_BASE_URL = "https://devdocs.io"

const SUPPORTED_TECHNOLOGIES = new Set([
  "javascript",
  "typescript", 
  "node",
  "react",
  "express",
  "python",
  "css",
  "html",
  "dom",
  "web"
])

const normalizeTechnology = (technology) => {
  const tech = technology.toLowerCase().trim()
  
  const aliases = {
    "js":         "javascript",
    "ts":         "typescript",
    "nodejs":     "node",
    "node.js":    "node",
    "reactjs":    "react",
    "react.js":   "react",
    "expressjs":  "express",
    "express.js": "express",
    "py":         "python",
  }

  return aliases[tech] || tech
}

const fetchDocs = async (technology, query) => {
  if (!technology || typeof technology !== 'string') {
    throw new Error("fetch_docs requires a valid technology name")
  }

  if (!query || typeof query !== 'string') {
    throw new Error("fetch_docs requires a valid search query")
  }

  const normalizedTech = normalizeTechnology(technology)

  if (!SUPPORTED_TECHNOLOGIES.has(normalizedTech)) {
    throw new Error(`Technology "${technology}" is not supported. Supported: ${[...SUPPORTED_TECHNOLOGIES].join(", ")}`)
  }

  const searchURL = `${DEVDOCS_BASE_URL}/search?q=${encodeURIComponent(query)}&doc=${normalizedTech}`

  const response = await fetch(searchURL)

  if (!response.ok) {
    throw new Error(`DevDocs API failed with status: ${response.status}`)
  }

  const data = await response.json()

  if (!data.results || data.results.length === 0) {
    throw new Error(`No documentation found for "${query}" in ${technology}`)
  }

  const topResults = data.results.slice(0, 3)

  return topResults.map(result => ({
    name: result.name,
    path: result.path,
    technology: normalizedTech,
    url: `${DEVDOCS_BASE_URL}/${normalizedTech}/${result.path}`,
  }))
}

export { fetchDocs }