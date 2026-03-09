import React from 'react';

export default function StatsCard({ title, value, icon: Icon, gradient, subtitle }) {
  const gradients = {
    purple: 'from-purple-600 to-indigo-600',
    blue: 'from-blue-600 to-cyan-500',
    green: 'from-emerald-600 to-teal-500',
    orange: 'from-orange-500 to-amber-500',
    pink: 'from-pink-600 to-rose-500',
  };

  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl blur-xl"
        style={{ background: `linear-gradient(135deg, var(--tw-gradient-stops))` }}
      />
      <div className="relative glass-card rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-400">{title}</p>
            <p className="text-4xl font-bold text-white mt-2 tracking-tight">{value}</p>
            {subtitle && (
              <p className="text-sm text-emerald-400 mt-2 flex items-center gap-1">
                {subtitle}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-xl bg-gradient-to-br ${gradients[gradient] || gradients.purple} shadow-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}