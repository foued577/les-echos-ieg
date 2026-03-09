import React from 'react';
import ContentCard from '../content/ContentCard';

export default function KanbanColumn({ category, contents, onViewContent }) {
  return (
    <div className="flex-shrink-0 w-80">
      <div 
        className="rounded-t-xl p-4 border-b-2"
        style={{ 
          background: `linear-gradient(135deg, ${category.color}20 0%, ${category.color}10 100%)`,
          borderColor: category.color
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: category.color }}
            />
            <h3 className="font-semibold text-white">{category.name}</h3>
          </div>
          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-white/10 text-slate-300">
            {contents.length}
          </span>
        </div>
      </div>
      <div className="glass-card rounded-b-xl p-3 min-h-[400px] space-y-3 border border-white/10 border-t-0">
        {contents.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-sm text-slate-600">Aucun contenu</p>
          </div>
        ) : (
          contents.map((content) => (
            <ContentCard 
              key={content.id} 
              content={content} 
              onView={onViewContent}
              showActions={true}
            />
          ))
        )}
      </div>
    </div>
  );
}