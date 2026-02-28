import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ExamplePage from './pages/ExamplePage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/example" element={<ExamplePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
