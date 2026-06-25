import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import ScanShield from './pages/ScanShield'
import ScamRadar from './pages/ScamRadar'
import FraudBot from './pages/FraudBot'
import About from './pages/About'
import { ThemeProvider } from './contexts/ThemeContext'

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-clarion-bg text-clarion-text transition-colors duration-300">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/"          element={<Home />} />
              <Route path="/scan"      element={<ScanShield />} />
              <Route path="/scam"      element={<ScamRadar />} />
              <Route path="/fraudbot"  element={<FraudBot />} />
              <Route path="/about"     element={<About />} />
              {/* Fallback */}
              <Route path="*" element={
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                  <p className="text-6xl font-black text-clarion-border mb-4">404</p>
                  <p className="text-clarion-text font-semibold text-xl mb-2">Page not found</p>
                  <p className="text-clarion-muted mb-6">This page doesn't exist in CLARION.</p>
                  <a href="/" className="btn-primary">Go to Home</a>
                </div>
              } />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  )
}
