import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { ROUTES } from './routePaths';

const PrivateRoutes: React.FC = () => {
  const isAuthenticated = true;

  // Get the first public route as default redirect
  const defaultPublicRoute = ROUTES.HOME;

  // If not authenticated, redirect to the default public route
  return isAuthenticated ? <Outlet /> : <Navigate to={defaultPublicRoute} replace />;
};

export default PrivateRoutes;
