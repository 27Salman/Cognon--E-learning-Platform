import React from 'react';

/**
 * Loading Spinner Component
 * @param {string} size - Spinner size (sm, md, lg)
 * @param {string} text - Optional loading text
 */
const Loader = ({ size = 'md', text = '' }) => {
  const sizes = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div
        className={`${sizes[size]} border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin`}
      ></div>
      {text && <p className="mt-4 text-gray-600">{text}</p>}
    </div>
  );
};

export default Loader;
