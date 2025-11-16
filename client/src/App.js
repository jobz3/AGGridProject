import logo from './logo.svg';
import './App.css';
// import DataGrid from './components/DataGrid.jsx';
import DataGridPage from './pages/DataGridPage';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

function App() {
  ModuleRegistry.registerModules([AllCommunityModule]);
  return (
    <div className="App">
      <DataGridPage />
    </div>
  );
}

export default App;
