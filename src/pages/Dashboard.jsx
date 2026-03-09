import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { contentsAPI, teamsAPI, rubriquesAPI } from '@/services/api';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Clock, CheckCircle, FileText, Link as LinkIcon, File, ChevronRight, PenLine, Folder, Tag } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function Dashboard() {
  const { user } = useAuth();
  const [myContents, setMyContents] = useState([]);
  const [recentApproved, setRecentApproved] = useState([]);
  const [pendingContents, setPendingContents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [rubriques, setRubriques] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      console.log('🔍=== DASHBOARD LOAD START ===');
      console.log('👤 Current user:', user);
      console.log('🆔 User ID:', user.id);
      
      const [myContentsResponse, pendingContentsResponse, approvedContentsResponse, teamsResponse, rubriquesResponse] = await Promise.all([
        contentsAPI.getMy().catch(err => ({ success: false, error: err })), // Get ALL user contents
        contentsAPI.getMy({ status: 'pending_review' }).catch(err => ({ success: false, error: err })), // Get pending user contents
        contentsAPI.getAll({ status: 'approved' }).catch(err => ({ success: false, error: err })), // Get ALL approved contents
        teamsAPI.getAll().catch(err => ({ success: false, error: err })), // Get all teams
        rubriquesAPI.getAll().catch(err => ({ success: false, error: err })) // Get all rubriques
      ]);

      const myContents = myContentsResponse.success ? myContentsResponse.data : [];
      const pendingContents = pendingContentsResponse.success ? pendingContentsResponse.data : [];
      const approvedContents = approvedContentsResponse.success ? approvedContentsResponse.data : [];
      const teams = teamsResponse.success ? teamsResponse.data : [];
      const rubriques = rubriquesResponse.success ? rubriquesResponse.data : [];

      console.log('📊 Final counts:');
      console.log('  - My contents:', myContents.length);
      console.log('  - My pending contents:', pendingContents.length);
      console.log('  - ALL approved contents:', approvedContents.length);
      console.log('  - Teams:', teams.length);
      console.log('  - Rubriques:', rubriques.length);
      
      // Normalize data
      const normalizedMyContents = myContents.map(content => ({
        ...content,
        id: content._id || content.id,
        team_ids: content.team_ids ? content.team_ids.map(id => id.toString()) : []
      }));

      const normalizedPending = pendingContents.map(content => ({
        ...content,
        id: content._id || content.id,
        team_ids: content.team_ids ? content.team_ids.map(id => id.toString()) : []
      }));

      const normalizedApproved = approvedContents.map(content => ({
        ...content,
        id: content._id || content.id,
        team_ids: content.team_ids ? content.team_ids.map(id => id.toString()) : [],
        author_name: content.author_id?.name || 'Anonyme' // Ensure author_name is populated
      }));

      console.log('🔍 Sample approved content:', normalizedApproved[0]);

      setMyContents(normalizedMyContents.slice(0, 5));
      setPendingContents(normalizedPending);
      setRecentApproved(normalizedApproved); // Show all approved contents
      setTeams(teams);
      setRubriques(rubriques);
      setLoading(false);
      
      console.log('✅ Dashboard data loaded');
    } catch (error) {
      console.error('💥 Error loading dashboard data:', error);
      setLoading(false);
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'link': return LinkIcon;
      case 'file': return File;
      default: return FileText;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-muted-foreground/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Header */}
      <div>
        <h1 className="font-sans text-4xl font-semibold text-foreground tracking-tight">
          Bonjour, {user?.name ? user.name.split(' ')[0] : '...'}
        </h1>
        <p className="text-muted-foreground mt-3 text-lg">
          Bienvenue sur le centre de connaissances
        </p>
      </div>

      {/* En attente de validation */}
      {pendingContents.length > 0 && (
        <div className="apple-card p-6 bg-warning-bg border-warning/20">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-5 h-5 text-warning" />
            <h3 className="font-semibold text-foreground">En attente de validation</h3>
            <span className="ml-auto text-sm text-muted-foreground apple-badge apple-badge-warning">
              {pendingContents.length} proposition{pendingContents.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="space-y-3">
            {pendingContents.slice(0, 3).map((content) => {
              const Icon = getTypeIcon(content.type);
              return (
                <div key={content.id} className="flex items-center gap-4 text-sm">
                  <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-warning" />
                  </div>
                  <div className="flex-1">
                    <span className="font-medium text-foreground">{content.title}</span>
                    <span className="text-muted-foreground text-xs block mt-1">
                      {format(new Date(content.created_at), 'dd MMM', { locale: fr })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mes propositions */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-sans text-2xl font-semibold text-foreground">Mes propositions</h2>
          <Link to={createPageUrl('CreateContent')}>
            <button className="apple-button-secondary flex items-center gap-2">
              <PenLine className="w-4 h-4" />
              Nouvelle
            </button>
          </Link>
        </div>
        
        {myContents.length === 0 ? (
          <div className="apple-card p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-lg font-medium">Vous n'avez pas encore proposé de contenu</p>
            <Link to={createPageUrl('CreateContent')}>
              <button className="apple-button-primary mt-4">
                Proposer un premier contenu
              </button>
            </Link>
          </div>
        ) : (
          <div className="apple-card">
            {myContents.map((content, index) => {
              const Icon = getTypeIcon(content.type);
              const statusConfig = {
                draft: { label: 'Brouillon', class: 'apple-badge', bgClass: 'bg-secondary' },
                pending_review: { label: 'En attente', class: 'apple-badge-warning', bgClass: 'bg-warning/10' },
                published: { label: 'Publié', class: 'apple-badge-success', bgClass: 'bg-success/10' },
                rejected: { label: 'Refusé', class: 'apple-badge-error', bgClass: 'bg-error/10' },
              };
              const status = statusConfig[content.status] || { label: 'Inconnu', class: 'apple-badge', bgClass: 'bg-secondary' };
              
              return (
                <div key={content.id} className={`p-4 flex items-center gap-4 group transition-all duration-200 ${index !== myContents.length - 1 ? 'border-b border-border' : ''}`}>
                  <div className={`w-12 h-12 rounded-xl ${status.bgClass} flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">{content.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {format(new Date(content.created_at), 'dd MMMM yyyy', { locale: fr })}
                    </p>
                  </div>
                  <span className={status.class}>
                    {status.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}