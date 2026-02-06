import { AppShell } from './components/layout/AppShell';
import { Outlet } from 'react-router-dom';

function App() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

export default App;
