import { lazy, Suspense } from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'

const AboutPage = lazy(() => import('./pages/AboutPage'))

function App() {
  return (
    <>
      <nav>
        <Link to="/">Главная</Link>
        {' | '}
        <Link to="/about">О нас</Link>
      </nav>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/about"
          element={
            <Suspense fallback={<div>Загрузка...</div>}>
              <AboutPage />
            </Suspense>
          }
        />
      </Routes>
    </>
  )
}

export default App
