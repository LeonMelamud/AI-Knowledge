import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { I18nProvider } from './lib/i18n'
import Layout from './components/Layout'
import SectionPage from './pages/SectionPage'
import HotNews from './pages/HotNews'
import Calculator from './pages/Calculator'
import TextGeneration from './pages/TextGeneration'
import { PrivacyPolicy, TermsOfService } from './pages/Legal'

export default function App() {
  return (
    <I18nProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/ai-basics" replace />} />
            <Route path="/hot-news" element={<HotNews />} />
            <Route path="/calculator" element={<Calculator />} />
            <Route path="/text-generation" element={<TextGeneration />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/:sectionId" element={<SectionPage />} />
            <Route path="*" element={<Navigate to="/ai-basics" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </I18nProvider>
  )
}
