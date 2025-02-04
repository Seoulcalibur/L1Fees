import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
    <App apiKey={import.meta.env.VITE_DUNE_KEY} />

)
