let fileTree = []
let fileContents = {}

const setFile = (filePath, content) => {
  fileTree.push(filePath)
  fileContents[filePath] = content
}

const getFileContents = () => fileContents
const getFileTree = () => fileTree

const clearStore = () => {
  fileTree = []
  fileContents = {}
}

export { setFile, getFileContents, getFileTree, clearStore }