import { BrowserRouter, useRoutes } from 'react-router-dom';
import './App.css'
import routes from './routes/Routes';

function App() {

  function AppRoutes() {
    const element = useRoutes(routes);
    return element;
  }

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App
