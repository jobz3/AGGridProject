import logo from './logo.svg';
import './App.css';
// import DataGrid from './components/DataGrid.jsx';
import DataGridPage from './pages/DataGridPage.jsx';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { ThemeProvider } from './context/ThemeContext.jsx';

function App() {
  ModuleRegistry.registerModules([AllCommunityModule]);
  return (
    <ThemeProvider>
      <div className="App">
        <DataGridPage />
      </div>
    </ThemeProvider>
  );
}

export default App;
