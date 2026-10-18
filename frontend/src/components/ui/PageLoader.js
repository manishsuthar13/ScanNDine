import React from 'react';
import Spinner from './Spinner';

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-canvas">
    <Spinner size="lg" />
  </div>
);

export default PageLoader;
