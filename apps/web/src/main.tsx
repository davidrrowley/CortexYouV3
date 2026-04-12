import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Carbon global styles (must be first)
import '@carbon/styles/css/styles.css';
import './styles/app.scss';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
