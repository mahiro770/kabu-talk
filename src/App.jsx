import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { StockMasterProvider } from './context/StockMasterContext';
import TopPage from './pages/TopPage';
import SearchResultsPage from './pages/SearchResultsPage';
import StockChatPage from './pages/StockChatPage';
import TermsPage from './pages/TermsPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <AuthProvider>
      <StockMasterProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<TopPage />} />
            <Route path="/search" element={<SearchResultsPage />} />
            <Route path="/stocks/:code" element={<StockChatPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </StockMasterProvider>
    </AuthProvider>
  );
}
