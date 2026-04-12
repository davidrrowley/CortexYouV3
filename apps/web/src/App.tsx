import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Shell from './components/Shell';
import DashboardView from './views/DashboardView';
import CaptureView from './views/CaptureView';
import BrowseView from './views/BrowseView';
import DetailView from './views/DetailView';
import ConceptsView from './views/ConceptsView';
import GraphView from './views/GraphView';
import SettingsView from './views/SettingsView';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Shell>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardView />} />
            <Route path="/capture" element={<CaptureView />} />
            <Route path="/browse" element={<BrowseView />} />
            <Route path="/sparks/:id" element={<DetailView />} />
            <Route path="/concepts" element={<ConceptsView />} />
            <Route path="/graph" element={<GraphView />} />
            <Route path="/settings" element={<SettingsView />} />
          </Routes>
        </Shell>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
