import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary'
import { countFailedQuery, countUncaughtErrors } from './lib/analytics'

countUncaughtErrors()

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => countFailedQuery(String(query.queryKey[0]), error),
  }),
  defaultOptions: {
    queries: {
      // GBIF fetches already apply centralized Retry-After-aware retries.
      // Avoid retry amplification at the query layer.
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)
