import logo from './logo.svg';
import './App.css';
// import DataGrid from './components/DataGrid.jsx';
import DataGridPage from './pages/DataGridPage.jsx';
import DetailPage from './pages/DetailPage.jsx';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  ModuleRegistry.registerModules([AllCommunityModule]);
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="App">
          <Routes>
            <Route path="/" element={<DataGridPage />} />
            <Route path="/detail" element={<DetailPage />} />
          </Routes>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
