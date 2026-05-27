const BLOCKED_DIRS = new Set([
  "node_modules", ".git", "dist", "build", ".next",
  "__pycache__", ".venv", "venv", "coverage", ".cache",
  ".idea", ".vscode"
])

const BLOCKED_FILES = new Set([
  ".env", ".env.local", ".env.production", ".env.development",
  "package-lock.json", "yarn.lock", "pnpm-lock.yaml",
  ".prettierrc", ".prettierrc.js", ".prettierrc.json",
  ".eslintrc", ".eslintrc.js", ".eslintrc.json",
  ".gitignore", ".gitattributes",
  "jest.config.js", "webpack.config.js",
  "babel.config.js", ".babelrc"
])

const ALLOWED_EXTENSIONS = new Set([
  ".js", ".ts", ".jsx", ".tsx",".json",
  ".py",
  ".html", ".css", ".scss",
  ".md",
])

const shouldProcessFile = (filePath) => {
  if (!filePath || typeof filePath !== 'string') return false

  const parts = filePath.split(/[\\/]/)

  const inBlockedDir = parts.some(part => {
    if (!part || typeof part !== 'string') return false
    return BLOCKED_DIRS.has(part.toLowerCase())
  })
  if (inBlockedDir) return false

  const filename = parts[parts.length - 1]
  if (!filename || typeof filename !== 'string') return false
  if (BLOCKED_FILES.has(filename.toLowerCase())) return false

  const ext = filename.slice(filename.lastIndexOf("."))
  if (!ALLOWED_EXTENSIONS.has(ext)) return false

  return true
}

export { shouldProcessFile }