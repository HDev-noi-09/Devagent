const store = {
  fileTree: [],
  fileContents: {}
}

const setFile = (filePath, content) => {
  store.fileTree.push(filePath)
  store.fileContents[filePath] = content
}

const getFileContents = () => store.fileContents
const getFileTree = () => store.fileTree

const clearStore = () => {
  store.fileTree = []
  store.fileContents = {}
}

export { setFile, getFileContents, getFileTree, clearStore }