import type { RouteObject } from 'react-router-dom';
import { ROUTES } from './routePaths';
import PrivateRoutes from './PrivateRoutes';
import PublicRoutes from './PublicRoutes';
import Home from '../pages/Home';

const Routes: RouteObject[] = [
  {
    element: <PublicRoutes />,
    children: [
      {
        path: ROUTES.HOME,
        element: <Home />,
      }
    ],
  },
  {
    element: <PrivateRoutes />,
    children: [
      // {
      //   path: ROUTES.HOME,
      //   element: <>home</>,
      // }
    ],
  },
];

export default Routes;
