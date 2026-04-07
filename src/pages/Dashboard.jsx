import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { contentsAPI, dashboardMessagesAPI } from '@/services/api';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { 
  Clock, 
  FileText, 
  Link as LinkIcon, 
  File, 
  PenLine, 
  TrendingUp,
  Users,
  Folder,
  Settings,
  Shield,
  Eye,
  ArrowUpRight,
  Activity,
  Calendar,
  BarChart3,
  Newspaper
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Animation component for count-up effect
const CountUp = ({ end, duration = 2000 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime = null;
    const startValue = 0;
    const endValue = end;

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      setCount(Math.floor(progress * (endValue - startValue) + startValue));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [end, duration]);

  return count;
};

// Quick access card component
const QuickAccessCard = ({ icon: Icon, title, description, to, color = "blue" }) => {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 hover:bg-blue-100 group-hover:border-blue-300",
    green: "bg-green-50 border-green-200 hover:bg-green-100 group-hover:border-green-300",
    purple: "bg-purple-50 border-purple-200 hover:bg-purple-100 group-hover:border-purple-300",
    orange: "bg-orange-50 border-orange-200 hover:bg-orange-100 group-hover:border-orange-300",
    red: "bg-red-50 border-red-200 hover:bg-red-100 group-hover:border-red-300",
  };

  const iconColors = {
    blue: "text-blue-600",
    green: "text-green-600",
    purple: "text-purple-600",
    orange: "text-orange-600",
    red: "text-red-600",
  };

  return (
    <Link to={to} className="group">
      <div className={`p-6 rounded-xl border-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${colorClasses[color]}`}>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${iconColors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-gray-600">
          {description}
        </p>
      </div>
    </Link>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const [myContents, setMyContents] = useState([]);
  const [recentApproved, setRecentApproved] = useState([]);
  const [pendingContents, setPendingContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeMessage, setActiveMessage] = useState(null);

  // Global refresh function for other components
  useEffect(() => {
    window.refreshDashboard = () => {
      console.log(' Manual dashboard refresh triggered');
      setRefreshKey(prev => prev + 1);
    };
    
    return () => {
      delete window.refreshDashboard;
    };
  }, []);

  useEffect(() => {
    if (user) {
      loadData();
      loadDashboardMessage();
    }
  }, [user, refreshKey]);

  const loadDashboardMessage = useCallback(async () => {
    try {
      console.log('📋 Loading active dashboard message...');
      const response = await dashboardMessagesAPI.getActive();
      setActiveMessage(response.data);
      console.log('📋 Active dashboard message loaded:', response.data);
    } catch (error) {
      console.error('📋 Error loading dashboard message:', error);
      // Fallback to default message
      setActiveMessage(null);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      console.log('🔍=== DASHBOARD LOAD START ===');
      console.log('👤 Current user:', user);
      console.log('🆔 User ID:', user.id);
      
      // Use new dashboard endpoint with pre-filtered data
      const [myContentsResponse, pendingContentsResponse, approvedContentsResponse] = await Promise.all([
        contentsAPI.getDashboard().catch(err => ({ success: false, error: err })),
        contentsAPI.getDashboard({ status: 'pending_review' }).catch(err => ({ success: false, error: err })),
        contentsAPI.getAll({ status: 'approved' }).catch(err => ({ success: false, error: err })),
      ]);

      const myContents = myContentsResponse.success ? myContentsResponse.data : [];
      const pendingContents = pendingContentsResponse.success ? pendingContentsResponse.data : [];
      const approvedContents = approvedContentsResponse.success ? approvedContentsResponse.data : [];

      console.log('📊=== DASHBOARD API RESPONSES ===');
      console.log('📝 My Contents from Dashboard API:', myContents.length, myContents.map(c => ({
        id: c._id,
        title: c.title,
        status: c.status,
        rubrique_name: c.rubrique_id?.name,
        team_names: c.rubrique_id?.team_ids?.map(t => t.name).join(', ') || 'Aucune équipe',
        created_at: c.created_at
      })));
      console.log('⏳ Pending Contents from Dashboard API:', pendingContents.length, pendingContents.map(c => ({
        id: c._id,
        title: c.title,
        status: c.status,
        rubrique_name: c.rubrique_id?.name,
        team_names: c.rubrique_id?.team_ids?.map(t => t.name).join(', ') || 'Aucune équipe',
        created_at: c.created_at
      })));
      console.log('✅ Approved Contents Raw:', approvedContents.length, approvedContents.slice(0, 3).map(c => ({
        id: c._id,
        title: c.title,
        status: c.status,
        created_at: c.created_at
      })));

      console.log('📊 Final counts:');
      console.log('  - My contents:', myContents.length);
      console.log('  - My pending contents:', pendingContents.length);
      console.log('  - ALL approved contents:', approvedContents.length);
      
      // No filtering needed - backend already filtered valid content
      console.log('🔍=== NO FRONTEND FILTERING NEEDED ===');
      console.log('📝 My Contents (already filtered):', myContents.length, 'items');
      
      const normalizedMyContents = myContents
        .filter(content => content && content._id)
        .map(content => ({
          ...content,
          id: content._id || content.id
        }));

      const normalizedPending = pendingContents
        .filter(content => content && content._id)
        .map(content => ({
          ...content,
          id: content._id || content.id
        }));

      const normalizedApproved = approvedContents
        .filter(content => content && content._id)
        .map(content => ({
          ...content,
          id: content._id || content.id,
          author_name: content.author_id?.name || 'Anonyme'
        }));

      console.log('🔍=== FINAL RESULTS ===');
      console.log(' My Contents Final:', normalizedMyContents.length, 'items');
      console.log('⏳ Pending Contents Final:', normalizedPending.length, 'items');
      console.log('✅ Approved Contents Final:', normalizedApproved.length, 'items');

      setMyContents(normalizedMyContents.slice(0, 5));
      setPendingContents(normalizedPending);
      setRecentApproved(normalizedApproved);
      setLoading(false);
      
      console.log('✅ Dashboard data loaded successfully');
    } catch (error) {
      console.error('💥 Error loading dashboard data:', error);
      setLoading(false);
    }
  }, [user]);

  const getTypeIcon = (type) => {
    switch(type) {
      case 'link': return LinkIcon;
      case 'file': return File;
      default: return FileText;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-fade-in">
            <h1 className="text-4xl font-serif text-gray-900 tracking-tight mb-4">
              Bonjour, {user?.name ? user.name.split(' ')[0] : '...'}
            </h1>
            <p className="text-xl text-gray-600 mb-8 font-light">
              {activeMessage ? (
                <span>
                  {activeMessage.icon && <span className="mr-2">{activeMessage.icon}</span>}
                  {activeMessage.content}
                </span>
              ) : (
                'Bienvenue sur votre centre de connaissances'
              )}
            </p>
            <div className="flex gap-4">
              <Link to={createPageUrl('CreateContent')}>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2">
                  <PenLine className="w-4 h-4" />
                  Nouvelle proposition
                </Button>
              </Link>
              <Link to={createPageUrl('Explorer')}>
                <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Explorer
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm text-green-600 font-medium">+12%</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              <CountUp end={myContents.length} />
            </div>
            <div className="text-sm text-gray-600 mt-1">Mes propositions</div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-sm text-orange-600 font-medium">
                {pendingContents.length} en attente
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              <CountUp end={pendingContents.length} />
            </div>
            <div className="text-sm text-gray-600 mt-1">En validation</div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm text-green-600 font-medium">+8%</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              <CountUp end={recentApproved.length} />
            </div>
            <div className="text-sm text-gray-600 mt-1">Approuvées</div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-sm text-purple-600 font-medium">Actif</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">24h</div>
            <div className="text-sm text-gray-600 mt-1">Dernière activité</div>
          </div>
        </section>

        {/* Quick Access */}
        <section>
          <h2 className="text-2xl font-serif text-gray-900 mb-6">Accès rapides</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <QuickAccessCard
              icon={Newspaper}
              title="La Gazette d'Occitanie"
              description="Créer votre magazine"
              to={createPageUrl('Gazette')}
              color="blue"
            />
            <QuickAccessCard
              icon={Folder}
              title="Rubriques"
              description="Gérer les catégories"
              to={createPageUrl('Rubriques')}
              color="green"
            />
            <QuickAccessCard
              icon={Users}
              title="Équipes"
              description="Gérer les équipes"
              to={createPageUrl('Teams')}
              color="purple"
            />
            <QuickAccessCard
              icon={Settings}
              title="Administration"
              description="Paramètres système"
              to={createPageUrl('Admin')}
              color="orange"
            />
            <QuickAccessCard
              icon={Shield}
              title="Modération"
              description="Valider les contenus"
              to={createPageUrl('Moderation')}
              color="red"
            />
            <QuickAccessCard
              icon={PenLine}
              title="Nouvelle proposition"
              description="Créer un contenu"
              to={createPageUrl('CreateContent')}
              color="blue"
            />
          </div>
        </section>

        {/* Pending Contents Alert */}
        {pendingContents.length > 0 && (
          <section className="animate-fade-in">
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-5 h-5 text-orange-600" />
                <h3 className="font-semibold text-gray-900">En attente de validation</h3>
                <span className="ml-auto text-sm text-orange-600 font-medium bg-orange-100 px-3 py-1 rounded-full">
                  {pendingContents.length} proposition{pendingContents.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="space-y-3">
                {pendingContents.slice(0, 3).map((content) => {
                  const Icon = getTypeIcon(content.type);
                  return (
                    <div key={content.id} className="flex items-center gap-4 text-sm bg-white p-3 rounded-lg">
                      <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">{content.title}</span>
                        <span className="text-gray-500 text-xs block mt-1">
                          {format(new Date(content.created_at), 'dd MMM', { locale: fr })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Recent Activity */}
        {recentApproved.length > 0 && (
          <section>
            <h2 className="text-2xl font-serif text-gray-900 mb-6">Activité récente</h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6">
                <div className="space-y-4">
                  {recentApproved.slice(0, 5).map((content) => {
                    const Icon = getTypeIcon(content.type);
                    return (
                      <div key={content.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <span className="font-medium text-gray-900">{content.title}</span>
                          <span className="text-gray-500 text-xs block mt-1">
                            Par {content.author_name} • {format(new Date(content.created_at), 'dd MMMM yyyy', { locale: fr })}
                          </span>
                        </div>
                        <span className="text-xs text-green-600 font-medium bg-green-100 px-2 py-1 rounded">
                          Approuvé
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* My Proposals */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-serif text-gray-900">Mes propositions</h2>
            <Link to={createPageUrl('CreateContent')}>
              <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
                <PenLine className="w-4 h-4" />
                Nouvelle
              </Button>
            </Link>
          </div>
          
          {myContents.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 text-lg font-medium mb-4">Vous n'avez pas encore proposé de contenu</p>
              <Link to={createPageUrl('CreateContent')}>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                  Proposer un premier contenu
                </Button>
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              {myContents.map((content, index) => {
                const Icon = getTypeIcon(content.type);
                const statusConfig = {
                  draft: { label: 'Brouillon', class: 'bg-gray-100 text-gray-600', bgClass: 'bg-gray-50' },
                  pending_review: { label: 'En attente', class: 'bg-orange-100 text-orange-600', bgClass: 'bg-orange-50' },
                  published: { label: 'Publié', class: 'bg-green-100 text-green-600', bgClass: 'bg-green-50' },
                  rejected: { label: 'Refusé', class: 'bg-red-100 text-red-600', bgClass: 'bg-red-50' },
                };
                const status = statusConfig[content.status] || { label: 'Inconnu', class: 'bg-gray-100 text-gray-600', bgClass: 'bg-gray-50' };
                
                return (
                  <div key={content.id} className={`p-6 flex items-center gap-4 group transition-all duration-200 hover:bg-gray-50 ${index !== myContents.length - 1 ? 'border-b border-gray-200' : ''}`}>
                    <div className={`w-12 h-12 rounded-xl ${status.bgClass} flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-gray-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate group-hover:text-blue-700 transition-colors">{content.title}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {format(new Date(content.created_at), 'dd MMMM yyyy', { locale: fr })}
                      </p>
                    </div>
                    <span className={`${status.class} px-3 py-1 rounded-full text-xs font-medium`}>
                      {status.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}