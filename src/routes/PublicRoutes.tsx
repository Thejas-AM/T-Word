import React from 'react';
import { Outlet } from 'react-router-dom';

const PublicRoutes: React.FC = () => {
  // Public routes are always accessible
  return <Outlet />;
};

export default PublicRoutes;
