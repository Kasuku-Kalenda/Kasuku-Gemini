import React from 'react';

// Using the image URL provided by the user for a reliable display.
const logoUrl = 'https://i.postimg.cc/8cYFbspt/Kasuku-logo.png';

export const ParrotIcon: React.FC<{ className?: string }> = ({ className }) => {
  return <img src={logoUrl} alt="Kasuku Logo" className={className} />;
};
