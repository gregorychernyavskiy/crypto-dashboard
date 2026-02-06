import { createBrowserRouter } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import App from '../App';
import { Home } from '../pages/Home';
import { Dashboard } from '../pages/Dashboard';

const routes: RouteObject[] = [
  {
    path: '/',
    element: <App />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/dashboard', element: <Dashboard /> },
    ],
  },
];

export const router = createBrowserRouter(routes);

export default router;
