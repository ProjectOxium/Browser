import { ErrorBoundary } from './components/ErrorBoundary'
import { BrowserWindow } from './components/BrowserWindow'

function App() {
  return (
    <ErrorBoundary>
      <BrowserWindow />
    </ErrorBoundary>
  )
}

export default App
