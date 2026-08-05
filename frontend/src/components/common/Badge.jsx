import React from 'react';

export function Badge({ category = 'general', children }) {
  const normalizedCat = (category || 'general').toLowerCase().replace(/\s+/g, '');
  return (
    <span className={`badge ${normalizedCat}`}>
      <svg className="icon icon-sm" viewBox="0 0 24 24">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>{' '}
      {children || category}
    </span>
  );
}

export default Badge;
