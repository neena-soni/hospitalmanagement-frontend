import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'   /*connects react to the page*/ 
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'


/*finds the empty <div id="root"> in index.html and gives React control of it. */
/*.render(...) draws the app, wrapped in StrictMode and BrowserRouter. The trailing comma is just JavaScript style. */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>  {/*Used for routing means it enables page navigation */}
      <App />
    </BrowserRouter>
  </StrictMode>,
)
