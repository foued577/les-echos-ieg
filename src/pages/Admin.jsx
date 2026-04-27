import React, { useState, useEffect } from 'react';
import { usersAPI, teamsAPI } from '@/services/api';
import { useAuth } from '@/lib/AuthContext';
import { Users, Settings, Shield, CheckCircle, X, Edit2, Trash2, Crown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import DashboardMessagesAdmin from '@/components/DashboardMessagesAdmin';

export default function Admin() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'MEMBER',
    password: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('ADMIN DEBUG: Loading admin data...');
      
      const [usersData, teamsData] = await Promise.all([
        usersAPI.getAll(),
        teamsAPI.getAll(),
      ]);
      
      console.log('ADMIN DEBUG: Users API response:', usersData);
      console.log('ADMIN DEBUG: Teams API response:', teamsData);
      
      // Both APIs return {success: true, data: [...]} structure
      const usersArray = usersData?.data || [];
      const teamsArray = Array.isArray(teamsData) ? teamsData : (teamsData?.data || []);
      
      console.log('ADMIN DEBUG: Users array:', usersArray);
      console.log('ADMIN DEBUG: Teams array:', teamsArray);
      console.log('ADMIN DEBUG: Teams count:', teamsArray.length);

      setUsers(usersArray);
      setTeams(teamsArray);
      setLoading(false);
      
      console.log('ADMIN DEBUG: Data loaded successfully');
    } catch (error) {
      console.error('ADMIN ERROR: Error loading data:', error);
      setLoading(false);
    }
  };

  const openEditDialog = (user) => {
    // Si user est null ou n'a pas d'ID, c'est un mode création
    if (!user || !user._id) {
      setEditingUser(null);
      setNewUser({
        name: '',
        email: '',
        role: 'MEMBER',
        password: ''
      });
    } else {
      // Mode modification
      setEditingUser(user);
      setNewUser({
        name: user.name,
        email: user.email,
        role: user.role,
        password: ''
      });
    }
    setShowEditDialog(true);
  };

  const updateUser = async () => {
    if (!editingUser) return;

    try {
      const response = await usersAPI.update(editingUser._id || editingUser.id, {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      });

      if (response.success) {
        setShowEditDialog(false);
        setEditingUser(null);
        setNewUser({ name: '', email: '', role: 'MEMBER', password: '' });
        
        toast.success(`Utilisateur ${newUser.name} mis à jour avec succès`);
        await loadData();
      } else {
        toast.error('Erreur lors de la mise à jour de l\'utilisateur');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Erreur lors de la mise à jour de l\'utilisateur');
    }
  };

  const deleteUser = async (userId) => {
    try {
      const response = await usersAPI.delete(userId);
      if (response.success) {
        toast.success('Utilisateur supprimé avec succès');
        await loadData();
      } else {
        toast.error('Erreur lors de la suppression de l\'utilisateur');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Erreur lors de la suppression de l\'utilisateur');
    }
  };

  const createUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      alert('Le nom, l\'email et le mot de passe sont requis');
      return;
    }

    try {
      const response = await usersAPI.create({
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        password: newUser.password
      });

      if (response.success) {
        // Fermer la modal
        setShowEditDialog(false);
        
        // Réinitialiser le formulaire
        setNewUser({
          name: '',
          email: '',
          role: 'MEMBER',
          password: ''
        });
        
        // Afficher un toast succès
        toast.success('Utilisateur créé avec succès');
        
        // Rafraîchir la liste des utilisateurs
        await loadData();
      } else {
        alert('Erreur lors de la création de l\'utilisateur: ' + (response.message || 'Erreur inconnue'));
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Erreur lors de la création de l\'utilisateur');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-slate-900 flex items-center gap-3">
            <Crown className="w-8 h-8 text-yellow-500" />
            Administration
          </h1>
          <p className="text-slate-500 mt-1">Gestion des utilisateurs et des permissions</p>
        </div>
        {user?.role === 'ADMIN' && (
          <Link to={createPageUrl('Dashboard')}>
            <Button variant="outline" className="text-slate-500 hover:text-slate-900">
              <Settings className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-stone-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Utilisateurs</h3>
            <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {users.length}
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-800">{users.length}</div>
          <p className="text-slate-500 text-sm">Total des utilisateurs</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-stone-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Admins</h3>
            <div className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
              {users.filter(u => u.role === 'ADMIN').length}
            </div>
          </div>
          <div className="text-3xl font-bold text-red-800">
            {users.filter(u => u.role === 'ADMIN').length}
          </div>
          <p className="text-slate-500 text-sm">Administrateurs</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-stone-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Équipes</h3>
            <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
              {teams.length}
            </div>
          </div>
          <div className="text-3xl font-bold text-green-800">{teams.length}</div>
          <p className="text-slate-500 text-sm">Équipes créées</p>
        </div>
      </div>

      {/* Dashboard Messages Management */}
      <DashboardMessagesAdmin />

      {/* Users List */}
      <div className="bg-white rounded-xl border border-stone-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900">Utilisateurs</h2>
            <Button 
              onClick={() => openEditDialog(null)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all"
            >
              <Users className="w-4 h-4 mr-2" />
              Ajouter un utilisateur
            </Button>
          </div>

          <div className="space-y-4">
            {users.map((userItem) => (
              <div key={userItem._id || userItem.id} className="flex items-center justify-between p-4 border border-stone-100 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                    <span className="text-slate-600 font-medium">
                      {userItem.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{userItem.name}</p>
                    <p className="text-sm text-slate-500">{userItem.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        userItem.role === 'ADMIN' 
                          ? 'bg-red-100 text-red-800' 
                          : userItem.role === 'EDITOR' 
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                      }`}>
                        {userItem.role === 'ADMIN' ? 'Admin' : userItem.role === 'EDITOR' ? 'Éditeur' : 'Utilisateur'}
                      </span>
                      {userItem.role === 'ADMIN' && (
                        <Crown className="w-3 h-3 text-yellow-600" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(userItem)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  
                  {user?.role === 'ADMIN' && (userItem._id || userItem.id) !== user.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteUser(userItem._id || userItem.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                placeholder="Nom complet"
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="email@example.com"
                type="email"
              />
            </div>
            <div className="space-y-2">
              <Label>Rôle *</Label>
              <select 
                value={newUser.role} 
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="w-full p-2 border border-stone-200 rounded-lg bg-white text-sm"
              >
                <option value="">Sélectionner un rôle</option>
                <option value="MEMBER">Utilisateur</option>
                <option value="EDITOR">Éditeur</option>
                <option value="ADMIN">Administrateur</option>
              </select>
            </div>
            {editingUser ? (
              <div className="space-y-2">
                <Label>Mot de passe</Label>
                <Input
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Laisser vide pour ne pas modifier"
                  type="password"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Mot de passe *</Label>
                <Input
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Mot de passe par défaut"
                  type="password"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Annuler
            </Button>
            <Button 
              onClick={editingUser ? updateUser : createUser}
              disabled={!newUser.name || !newUser.email || !newUser.role}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all"
            >
              {editingUser ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
