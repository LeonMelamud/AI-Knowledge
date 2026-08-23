import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { I18nProvider } from './lib/i18n'
import Layout from './components/Layout'
import SectionPage from './pages/SectionPage'
import HotNews from './pages/HotNews'
import Calculator from './pages/Calculator'
import { PrivacyPolicy, TermsOfService } from './pages/Legal'
import { About, Contact } from './pages/Info'

export default function App() {
  return (
    <I18nProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/ai-basics" replace />} />
            <Route path="/hot-news" element={<HotNews />} />
            <Route path="/calculator" element={<Calculator />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            {/* Named pages must precede /:sectionId — it matches anything */}
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/:sectionId" element={<SectionPage />} />
            <Route path="*" element={<Navigate to="/ai-basics" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </I18nProvider>
  )
}
