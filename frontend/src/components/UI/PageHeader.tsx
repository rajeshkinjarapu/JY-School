import React from 'react';

interface PageHeaderProps {
  title: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, icon, action }) => {
  return (
    <div className="relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 via-blue-800 to-indigo-900 px-6 py-6 sm:px-8 sm:py-8 shadow-xl border-b border-indigo-900/50 shrink-0">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
      <div className="absolute bottom-0 left-20 w-40 h-40 bg-blue-500/20 rounded-full blur-2xl pointer-events-none"></div>
      <div className="relative z-10 flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
        {icon && (
          <div className="hidden sm:flex p-3 bg-white/10 backdrop-blur-md text-white rounded-2xl border border-white/20 shadow-inner items-center justify-center">
            {icon}
          </div>
        )}
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-md">
          {title}
        </h1>
      </div>
      {action && (
        <div className="relative z-10 flex shrink-0 w-full sm:w-auto">
          {action}
        </div>
      )}
    </div>
  );
};
