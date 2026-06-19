import { BrowserRouter, Routes, Route } from 'react-router-dom'
import UploadPage from './pages/uploadPage'
import ChatPage from './pages/chatPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<UploadPage />} />
        <Route path="/chat" element={<ChatPage />} />
      </Routes>
    </BrowserRouter>
  )
}
export default App 