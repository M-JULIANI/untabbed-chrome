import './index.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { Toaster } from './components/ui/toaster';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("No root element found");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
    <Toaster />
  </React.StrictMode>
)