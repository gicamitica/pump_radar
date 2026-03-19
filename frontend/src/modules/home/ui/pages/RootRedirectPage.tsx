import React from 'react';
import { Navigate } from 'react-router-dom';

const RootRedirectPage: React.FC = () => {
  return <Navigate to="/dashboard" replace />;
};

export default RootRedirectPage;
