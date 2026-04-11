import React from 'react';
import { Link } from 'react-router-dom';

const Logo = ({ variant = 'default', size = 'md', showText = true, linkTo = '/' }) => {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-3xl',
    xl: 'text-5xl'
  };

  const subtextSizes = {
    sm: 'text-[8px]',
    md: 'text-[10px]',
    lg: 'text-xs',
    xl: 'text-sm'
  };

  const getLogoSrc = () => {
    switch (variant) {
      case 'dark':
        return '/logo-dark.svg';
      case 'white':
        return '/logo-white.svg';
      default:
        return '/logo-icon.svg';
    }
  };

  if (!showText) {
    return (
      <Link to={linkTo} className="flex items-center">
        <img src={getLogoSrc()} alt="Naseej Logo" className={`${sizes[size]} transition-transform hover:scale-105`} />
      </Link>
    );
  }

  return (
    <Link to={linkTo} className="flex items-center gap-2 group">
      <img src="/logo-icon.svg" alt="Naseej Logo" className={`${sizes[size]} transition-transform group-hover:scale-105`} />
      <div>
        <div className={`font-bold ${textSizes[size]} bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent`}>
          Naseej
        </div>
        <div className={`${subtextSizes[size]} text-gray-400 -mt-1`}>
          CARPETS & TEXTILES
        </div>
      </div>
    </Link>
  );
};

export default Logo;