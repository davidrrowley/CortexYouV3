import React from 'react';
import ReactDOM from 'react-dom/client';
import { GlobalTheme, usePrefersDarkScheme } from '@carbon/react';
import App from './App';

// Carbon global styles (must be first)
import '@carbon/styles/css/styles.css';
import './styles/app.scss';

function Root() {
  const prefersDark = usePrefersDarkScheme();
  return (
    <GlobalTheme theme={prefersDark ? 'g100' : 'g10'}>
      <App />
    </GlobalTheme>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
