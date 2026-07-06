import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles.css'
import './styles/admin-v3.css'
import './styles/overview-v4.css'
import './styles/site-admin-v2.css'
import './styles/projects-admin-v2.css'
import './styles/services-admin-v2.css'
import './styles/about-project-admin-v2.css'
import './styles/about-admin-v3.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
