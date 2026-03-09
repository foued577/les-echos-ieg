import React from 'react';
import { Users, FolderOpen, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function TeamCard({ team, membersCount, categoriesCount, contentsCount, userRole }) {
  const roleLabels = {
    admin: { label: 'Admin', gradient: 'from-purple-500 to-indigo-500' },
    membre: { label: 'Membre', gradient: 'from-emerald-500 to-teal-500' },
    lecteur: { label: 'Lecteur', gradient: 'from-slate-500 to-slate-600' },
  };

  const role = roleLabels[userRole] || roleLabels.lecteur;

  return (
    <Link to={createPageUrl(`TeamDetail?id=${team._id}`)}>
      <div className="glass-card rounded-2xl p-6 border border-white/10 hover:border-purple-500/30 transition-all group cursor-pointer">
        <div className="flex items-start justify-between mb-5">
          <div 
            className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
            style={{ 
              background: `linear-gradient(135deg, ${team.color || '#6366f1'} 0%, ${team.color || '#6366f1'}dd 100%)`,
              boxShadow: `0 10px 40px -10px ${team.color || '#6366f1'}80`
            }}
          >
            {team.name?.slice(0, 2).toUpperCase()}
          </div>
          {userRole && (
            <span className={`px-3 py-1 text-xs font-medium rounded-full bg-gradient-to-r ${role.gradient} text-white`}>
              {role.label}
            </span>
          )}
        </div>

        <h3 className="font-semibold text-xl text-white mb-2 group-hover:text-purple-300 transition-colors">
          {team.name}
        </h3>
        {team.description && (
          <p className="text-sm text-slate-400 line-clamp-2 mb-5">{team.description}</p>
        )}

        <div className="flex items-center gap-6 text-sm text-slate-500 mb-5">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" />
            <span className="text-slate-300">{membersCount}</span>
            <span>membres</span>
          </div>
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-purple-400" />
            <span className="text-slate-300">{categoriesCount}</span>
            <span>rubriques</span>
          </div>
        </div>

        <div className="flex items-center text-sm text-purple-400 group-hover:text-purple-300 transition-colors">
          <span className="font-medium">Voir l'équipe</span>
          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
}