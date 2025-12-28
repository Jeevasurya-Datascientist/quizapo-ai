import React from 'react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] w-full p-8 animate-in fade-in duration-700">

      <div className="loader-cube-container relative mb-12">
        {/* Glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />

        <div className="loader-cube">
          <div className="loader-face face-front">JS</div>
          <div className="loader-face face-back"></div>
          <div className="loader-face face-right"></div>
          <div className="loader-face face-left"></div>
          <div className="loader-face face-top"></div>
          <div className="loader-face face-bottom"></div>
        </div>
      </div>

      <div className="text-center space-y-3 z-10">
        <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600 animate-pulse">
          Processing
        </h3>
        <p className="text-sm text-muted-foreground animate-pulse">
          Please wait while we crunch the data...
        </p>
      </div>

    </div>
  );
};