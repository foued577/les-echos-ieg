import React from 'react';
import { Link as LinkIcon, FileText, File, Clock, CheckCircle, XCircle, Clock3, ArrowUpRight } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const typeIcons = {
  link: LinkIcon,
  file: File,
  article: FileText,
};

const statusConfig = {
  brouillon: { label: 'Brouillon', gradient: 'from-slate-500 to-slate-600', icon: Clock },
  en_attente: { label: 'En attente', gradient: 'from-amber-500 to-orange-500', icon: Clock3 },
  approuve: { label: 'Approuvé', gradient: 'from-emerald-500 to-teal-500', icon: CheckCircle },
  refuse: { label: 'Refusé', gradient: 'from-rose-500 to-pink-500', icon: XCircle },
};

export default function RecentActivity({ contents, title = "Activité récente" }) {
  return (
    <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
      <div className="p-6 border-b border-white/10">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
      <div className="p-4">
        {contents.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">Aucune activité récente</p>
        ) : (
          <div className="space-y-2">
            {contents.map((content) => {
              const TypeIcon = typeIcons[content.type] || FileText;
              const status = statusConfig[content.status];
              const StatusIcon = status?.icon || Clock;
              
              return (
                <div key={content.id} className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-all group cursor-pointer">
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${status?.gradient} shadow-lg`}>
                    <TypeIcon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate group-hover:text-purple-300 transition-colors">
                      {content.title}
                    </p>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {content.author_name || 'Anonyme'} • {format(new Date(content.created_date), 'dd MMM yyyy', { locale: fr })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full bg-gradient-to-r ${status?.gradient} text-white`}>
                      {status?.label}
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}