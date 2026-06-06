const DEVDOCS_BASE_URL = "https://devdocs.io"
const MDN_BASE_URL = "https://developer.mozilla.org/api/v1/search"

const fetchFromMDN = async (query) => {
  const response = await fetch(
    `${MDN_BASE_URL}?q=${encodeURIComponent(query)}&locale=en-US`
  )
  if (!response.ok) throw new Error(`MDN failed: ${response.status}`)
  
  const data = await response.json()
  if (!data.documents || data.documents.length === 0) {
    throw new Error("No MDN results")
  }
  console.log("Docs results:", data)
  return data.documents.slice(0, 3).map(doc => ({
    title: doc.title,
    summary: doc.summary,
    url: `https://developer.mozilla.org${doc.mdn_url}`,
    source: "MDN"
  }))
}

const fetchFromDevDocs = async (technology, query) => {
  const response = await fetch(
    `${DEVDOCS_BASE_URL}/search?q=${encodeURIComponent(query)}&doc=${technology}`
  )
  if (!response.ok) throw new Error(`DevDocs failed: ${response.status}`)

  const data = await response.json()
  if (!data.results || data.results.length === 0) {
    throw new Error("No DevDocs results")
  }
  console.log("Docs results:", data)
  return data.results.slice(0, 3).map(result => ({
    title: result.name,
    url: `${DEVDOCS_BASE_URL}/${technology}/${result.path}`,
    source: "DevDocs"
  }))
}

const fetchFromNpm = async (query) => {
  const response = await fetch(
    `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=3`
  )
  if (!response.ok) throw new Error(`npm failed: ${response.status}`)

  const data = await response.json()
  if (!data.objects || data.objects.length === 0) {
    throw new Error("No npm results")
  }
  console.log("Docs results:", data)
  return data.objects.slice(0, 3).map(obj => ({
    title: obj.package.name,
    summary: obj.package.description,
    url: `https://www.npmjs.com/package/${obj.package.name}`,
    source: "npm"
  }))
}

const LANGUAGE_MAP = {
  "js": "javascript",
  "javascript": "javascript",
  "ts": "typescript",
  "typescript": "typescript",
  "nodejs": "node",
  "node.js": "node",
  "node": "node",
  "python": "python",
  "py": "python",
  "express": "express",
  "expressjs": "express",
  "react": "react",
  "css": "css",
  "html": "html"
}

const fetchDocs = async (technology, query) => {
  if (!technology || typeof technology !== 'string') {
    throw new Error("fetch_docs requires a valid technology name")
  }
  if (!query || typeof query !== 'string') {
    throw new Error("fetch_docs requires a valid search query")
  }

  const normalizedTech = LANGUAGE_MAP[technology.toLowerCase()] || technology.toLowerCase()

 
  if (["node", "python", "express", "typescript"].includes(normalizedTech)) {
    try {
      return await fetchFromDevDocs(normalizedTech, query)
    } catch {
      try {
        return await fetchFromNpm(query)
      } catch {
        throw new Error(`No documentation found for "${query}" in ${technology}`)
      }
    }
  }


  if (["javascript", "react", "css", "html"].includes(normalizedTech)) {
    try {
      return await fetchFromMDN(query)
    } catch {
      try {
        return await fetchFromDevDocs(normalizedTech, query)
      } catch {
        throw new Error(`No documentation found for "${query}" in ${technology}`)
      }
    }
  }

 
  try {
    return await fetchFromMDN(query)
  } catch {
    try {
      return await fetchFromDevDocs(normalizedTech, query)
    } catch {
      try {
        return await fetchFromNpm(query)
      } catch {
        throw new Error(`No documentation found for "${query}" in ${technology}`)
      }
    }
  }
}

export { fetchDocs }