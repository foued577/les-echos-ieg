import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { teamsAPI } from '@/services/api';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/lib/AuthContext';
import { APP_NAME } from '@/config/app';
import { 
  Home,
  Users2,
  Layers,
  Shield,
  PenLine,
  Menu,
  X,
  LogOut,
  ChevronRight,
  BookOpen,
  FolderOpen,
  Newspaper,
  User
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Avatar from '@/components/Avatar';

export default function Layout({ children, currentPageName }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [teams, setTeams] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [rubriques, setRubriques] = useState([]);
  const [contents, setContents] = useState([]);
  const { user, logout, isAuthenticated } = useAuth();

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'admin';

  useEffect(() => {
    console.log('🏗️ Layout mounted');
    console.log('👤 Current user:', user);
    console.log('🔐 Is authenticated:', isAuthenticated);
    console.log('🔑 Token in localStorage:', !!localStorage.getItem('auth_token'));
    
    if (user) {
      loadPendingCount();
      if (isAdmin) {
        loadTeams();
      } else {
        loadRubriquesAndContents();
      }
    }
  }, [user, isAdmin]);

  // Refresh pending count when currentPage changes to Moderation
  useEffect(() => {
    if (user && currentPageName === 'Moderation') {
      loadPendingCount();
    }
  }, [currentPageName, user]);

  const loadPendingCount = async () => {
    try {
      console.log('🔍 Loading pending count...');
      const { contentsAPI } = await import('@/services/api');
      const response = await contentsAPI.getAll({ status: 'pending_review' });
      
      if (response.success) {
        const count = response.data.length;
        setPendingCount(count);
        console.log('✅ Pending count loaded:', count);
      } else {
        setPendingCount(0);
      }
    } catch (error) {
      console.error('💥 Error loading pending count:', error);
      setPendingCount(0);
    }
  };

  const loadTeams = async () => {
    console.log('🔥 loadTeams called!');
    try {
      console.log('🔍=== LOAD TEAMS START ===');
      console.log('👤 User object:', user);
      console.log('👤 User ID:', user?.id || user?._id);
      console.log('🔐 Is authenticated:', isAuthenticated);
      
      console.log('🌐 Making API call to /teams...');
      const response = await apiClient.get('/teams');
      
      console.log('📦 Full API response:', response);
      console.log('📦 Response data:', response.data);
      
      // Backend renvoie {success: true, count: 2, data: [...]}
      const teamsArray = Array.isArray(response.data?.data) ? response.data.data : [];
      
      console.log('📋 Teams array length:', teamsArray.length);
      console.log('📋 Teams array:', teamsArray);
      
      // Plus de filtrage - le backend renvoie déjà les équipes de l'utilisateur
      const normalizedTeams = teamsArray.map(team => ({
        ...team,
        id: team._id || team.id
      }));
      
      console.log('🎯 Normalized teams:', normalizedTeams);
      console.log('🎯 Setting teams state:', normalizedTeams.slice(0, 5));
      
      setTeams(normalizedTeams.slice(0, 5));
      console.log('✅ Teams loaded for Layout:', normalizedTeams.length);
      console.log('👤 User teams:', normalizedTeams.map(t => ({ name: t.name, id: t.id })));
      console.log('🔍=== LOAD TEAMS END ===');
    } catch (error) {
      console.error('💥=== LOAD TEAMS ERROR ===');
      console.error('💥 Error status:', error.response?.status);
      console.error('💥 Error response:', error.response?.data);
      console.error('💥 Error message:', error.message);
      setTeams([]);
    }
  };

  const loadRubriquesAndContents = async () => {
    try {
      console.log('🔍 Loading rubriques, contents and teams...');
      
      // Load teams for simple users
      const teamsResponse = await apiClient.get('/teams');
      const teamsArray = Array.isArray(teamsResponse.data?.data) ? teamsResponse.data.data : [];
      setTeams(teamsArray);
      
      // Load rubriques
      const rubriquesResponse = await apiClient.get('/rubriques');
      const rubriquesArray = Array.isArray(rubriquesResponse.data?.data) ? rubriquesResponse.data.data : [];
      setRubriques(rubriquesArray);
      
      // Load approved contents
      const { contentsAPI } = await import('@/services/api');
      const contentsResponse = await contentsAPI.getAll({ status: 'approved' });
      const contentsArray = Array.isArray(contentsResponse.data) ? contentsResponse.data : [];
      setContents(contentsArray);
      
      console.log('✅ Rubriques, contents and teams loaded');
    } catch (error) {
      console.error('💥 Error loading rubriques, contents and teams:', error);
      setTeams([]);
      setRubriques([]);
      setContents([]);
    }
  };

  console.log('Layout - Current user:', user);
  console.log('Layout - User role:', user?.role);
  console.log('Layout - Is authenticated:', isAuthenticated);

  const navigation = [
    { name: 'Accueil', page: 'Dashboard', icon: Home },
    { name: 'La Gazette d\'Occitanie', page: 'Gazette', icon: Newspaper },
    ...(isAdmin ? [
      { name: 'Équipes', page: 'Teams', icon: Users2 },
      { name: 'Rubriques', page: 'Rubriques', icon: FolderOpen },
      { name: 'Administration', page: 'Admin', icon: Shield },
      { name: 'Modération', page: 'Moderation', icon: Shield, badge: pendingCount }
    ] : []),
  ];

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Helper function to get contents by rubrique for simple users
  const getContentsByRubrique = () => {
    return rubriques.map(rubrique => ({
      ...rubrique,
      contents: contents.filter(content =>
        content.rubrique_id === rubrique._id ||
        content.rubrique_id?._id === rubrique._id
      )
    })).filter(rubrique => rubrique.contents.length > 0);
  };

  // Helper function to group contents by team then by rubrique for simple users
  const getGroupedSpaces = () => {
    // Filter approved contents only
    const approvedContents = contents.filter(c =>
      c.status === "approved" || c.status === "approuve"
    );

    return teams.map(team => {
      const teamContents = approvedContents.filter(content =>
        content.team_ids?.some(t =>
          String(t._id || t) === String(team._id)
        ) ||
        content.teams?.some(t =>
          String(t._id || t) === String(team._id)
        )
      );

      const rubriquesForTeam = rubriques
        .map(rubrique => {
          const rubriqueContents = teamContents.filter(content =>
            String(content.rubrique_id?._id || content.rubrique_id) === String(rubrique._id)
          );

          return {
            ...rubrique,
            contents: rubriqueContents
          };
        })
        .filter(rubrique => rubrique.contents.length > 0);

      return {
        ...team,
        rubriques: rubriquesForTeam
      };
    }).filter(team => team.rubriques.length > 0);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-card/80 backdrop-blur-xl border-b border-border z-50">
        <div className="h-full px-6 flex items-center justify-between max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-all duration-200"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link to={createPageUrl('Dashboard')} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shadow-sm border border-black/8 p-1.5">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="font-sans text-xl font-semibold text-foreground hidden sm:block">{APP_NAME}</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link to={createPageUrl('CreateContent')}>
              <button className="apple-button-secondary flex items-center gap-2">
                <PenLine className="w-4 h-4" />
                <span className="hidden sm:inline">Proposer</span>
              </button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 p-2 rounded-xl hover:bg-secondary transition-all duration-200">
                  <Avatar 
                    src={user?.avatar} 
                    alt={user?.name} 
                    size="sm"
                    fallbackText={user?.name}
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 apple-card">
                <div className="px-4 py-3">
                  <p className="font-semibold text-sm text-foreground">{user?.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{user?.email}</p>
                </div>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center w-full">
                    <User className="w-4 h-4 mr-3" />
                    Mon profil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem onClick={() => logout()} className="text-muted-foreground hover:text-foreground transition-colors">
                  <LogOut className="w-4 h-4 mr-3" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`fixed top-16 left-0 bottom-0 w-72 bg-sidebar-background border-r border-sidebar-border z-40 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <nav className="p-4 space-y-2">
          {navigation.map((item) => {
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                onClick={() => setMobileMenuOpen(false)}
                className={`apple-sidebar-item ${isActive ? 'active' : ''}`}
              >
                <item.icon className="w-5 h-5 text-muted-foreground" />
                <span className="flex-1">{item.name}</span>
                {item.badge > 0 && (
                  <span className="apple-badge apple-badge-warning">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Workspaces */}
        <div className="px-4 mt-8">
          <p className="px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Espaces</p>
          <div className="space-y-1">
            {isAdmin ? (
              // Admin: Show teams
              teams.map((team) => (
                <Link
                  key={team.id}
                  to={createPageUrl(`TeamDetail?id=${team._id}`)}
                  onClick={() => setMobileMenuOpen(false)}
                  className="apple-sidebar-item"
                >
                  <div 
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: team.color || '#0071e3' }}
                  />
                  <span className="flex-1 truncate">{team.name}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))
            ) : (
              // Simple user: Show teams with rubriques and contents (hierarchical)
              getGroupedSpaces().map((team) => (
                <div key={team._id} className="space-y-2">
                  {/* Team name - first level */}
                  <div className="font-semibold text-sm flex items-center gap-2 px-4 py-2 text-foreground">
                    <div 
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: team.color || '#0071e3' }}
                    />
                    <span className="truncate">{team.name}</span>
                  </div>

                  {/* Rubriques for this team - second level */}
                  {team.rubriques.map((rubrique) => (
                    <div key={rubrique._id} className="ml-4 space-y-1">
                      {/* Rubrique name */}
                      <div className="text-sm font-medium text-muted-foreground flex items-center gap-2 px-4 py-1">
                        <FolderOpen className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{rubrique.name || rubrique.title}</span>
                      </div>

                      {/* Contents for this rubrique - third level */}
                      {rubrique.contents.map((content) => (
                        <Link
                          key={content._id}
                          to={createPageUrl(`content/${content._id}`)}
                          onClick={() => setMobileMenuOpen(false)}
                          className="block ml-4 text-xs text-muted-foreground hover:text-blue-600 truncate px-4 py-1 transition-colors"
                        >
                          • {content.title}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="pt-16 lg:pl-72">
        <div className="w-full px-6 py-8 lg:px-12 xl:px-16">
          <div className="w-full max-w-none xl:max-w-[1800px] mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}