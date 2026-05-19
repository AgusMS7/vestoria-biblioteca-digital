import { Routes, Route } from 'react-router-dom'
import { LibraryPage } from './pages/LibraryPage'
import { AlbumPage } from './pages/AlbumPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LibraryPage />} />
      <Route path="/album/:id" element={<AlbumPage />} />
    </Routes>
  )
}

export default App
