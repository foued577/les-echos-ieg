import React, { useState, useEffect } from 'react';
import { X, Search, User, Users } from 'lucide-react';

const UserSelector = ({ selectedUsers = [], onUsersChange, disabled = false }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [allUsers, setAllUsers] = useState([]); // Fallback
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showAllUsers, setShowAllUsers] = useState(false);

  // Load all users for fallback
  const loadAllUsers = async () => {
    if (isLoadingAll || allUsers.length > 0) return;
    
    setIsLoadingAll(true);
    try {
      console.log('📡 DEBUG: Loading ALL users for fallback');
      
      const API_BASE_URL = import.meta.env.VITE_API_URL ||
        (window.location.hostname.includes('les-echos-ieg-front.onrender.com')
          ? 'https://les-echos-ieg.onrender.com/api'
          : 'http://localhost:5000/api');

      const response = await fetch(`${API_BASE_URL}/users/debug`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 DEBUG: All users API response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('📡 DEBUG: All users API response data:', data);
        
        if (data.success && data.data) {
          console.log('✅ DEBUG: Loaded all users:', data.data.length);
          setAllUsers(data.data);
        }
      } else {
        console.log('❌ DEBUG: Failed to load all users');
      }
    } catch (error) {
      console.error('❌ ERROR: Failed to load all users:', error);
    } finally {
      setIsLoadingAll(false);
    }
  };

  // Search users
  useEffect(() => {
    const searchUsers = async () => {
      console.log('🔍 DEBUG: Search users called with query:', searchQuery);
      
      if (searchQuery.trim().length < 2) {
        console.log('🔍 DEBUG: Query too short, clearing results');
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        console.log('📡 DEBUG: Making API call to /users/search?q=', searchQuery);
        
        const API_BASE_URL = import.meta.env.VITE_API_URL ||
          (window.location.hostname.includes('les-echos-ieg-front.onrender.com')
            ? 'https://les-echos-ieg.onrender.com/api'
            : 'http://localhost:5000/api');

        const response = await fetch(`${API_BASE_URL}/users/search?q=${encodeURIComponent(searchQuery)}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('📡 DEBUG: API response status:', response.status);
        console.log('📡 DEBUG: API response headers:', response.headers);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('📡 DEBUG: API response data:', data);
        console.log('📡 DEBUG: Users found:', data?.data?.length || 0);

        if (data.success && data.data) {
          console.log('✅ DEBUG: Setting search results:', data.data);
          setSearchResults(data.data);
        } else {
          console.log('❌ DEBUG: No success or data in response');
          setSearchResults([]);
        }
      } catch (error) {
        console.error('❌ ERROR: Failed to search users:', error);
        console.error('❌ ERROR: Error details:', error.message);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Filter all users locally (fallback)
  const filteredAllUsers = allUsers.filter(user => {
    if (!searchQuery || searchQuery.trim().length < 2) return true;
    
    const q = searchQuery.toLowerCase();
    const name = (user.name || '').toLowerCase();
    const email = (user.email || '').toLowerCase();
    const firstName = (user.firstName || '').toLowerCase();
    const lastName = (user.lastName || '').toLowerCase();
    const fullName = (user.fullName || '').toLowerCase();
    const username = (user.username || '').toLowerCase();
    
    return name.includes(q) || 
           email.includes(q) || 
           firstName.includes(q) || 
           lastName.includes(q) || 
           fullName.includes(q) || 
           username.includes(q);
  });

  // Add user to selection
  const addUser = (user) => {
    console.log('➕ DEBUG: Adding user to selection:', user);
    
    if (!selectedUsers.find(u => u._id === user._id)) {
      const newSelection = [...selectedUsers, user];
      console.log('✅ DEBUG: New user selection:', newSelection);
      onUsersChange(newSelection);
    } else {
      console.log('⚠️ DEBUG: User already in selection');
    }
    
    setSearchQuery('');
    setSearchResults([]);
  };

  // Remove user from selection
  const removeUser = (userId) => {
    console.log('➖ DEBUG: Removing user from selection:', userId);
    const newSelection = selectedUsers.filter(u => u._id !== userId);
    console.log('✅ DEBUG: New user selection after removal:', newSelection);
    onUsersChange(newSelection);
  };

  // Display users (search results or filtered all users)
  const displayUsers = showAllUsers ? filteredAllUsers : searchResults;

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Utilisateurs assignés
      </label>
      
      {/* Selected users */}
      <div className="flex flex-wrap gap-2">
        {selectedUsers.map((user) => (
          <div
            key={user._id}
            className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
          >
            <User className="w-4 h-4" />
            <span>{user.name || user.fullName || user.email}</span>
            {!disabled && (
              <button
                onClick={() => removeUser(user._id)}
                className="ml-1 hover:text-blue-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Search input */}
      {!disabled && (
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                setIsOpen(true);
                loadAllUsers(); // Load all users when focused
              }}
              placeholder="Rechercher des utilisateurs..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Toggle between search and all users */}
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
            <button
              onClick={() => setShowAllUsers(!showAllUsers)}
              className="p-1 text-gray-400 hover:text-gray-600"
              title={showAllUsers ? "Utiliser la recherche API" : "Afficher tous les utilisateurs"}
            >
              <Users className="w-4 h-4" />
            </button>
          </div>

          {/* Search results dropdown */}
          {isOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {isSearching ? (
                <div className="p-3 text-gray-500 text-center">
                  Recherche en cours...
                </div>
              ) : isLoadingAll ? (
                <div className="p-3 text-gray-500 text-center">
                  Chargement des utilisateurs...
                </div>
              ) : displayUsers.length === 0 ? (
                <div className="p-3 text-gray-500 text-center">
                  {showAllUsers ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur trouvé - Essayez d\'afficher tous les utilisateurs'}
                </div>
              ) : (
                displayUsers.map((user) => (
                  <div
                    key={user._id}
                    onClick={() => addUser(user)}
                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {user.name || user.fullName || `${user.firstName || ''} ${user.lastName || ''}` || 'Utilisateur sans nom'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                        {showAllUsers && (
                          <div className="text-xs text-gray-400">
                            Mode: Tous les utilisateurs
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <p className="text-xs text-gray-500">
        Les utilisateurs assignés pourront voir cette gazette. Seul le créateur peut modifier les assignations.
        {showAllUsers && " Mode dépannage : affichage de tous les utilisateurs."}
      </p>
    </div>
  );
};

export default UserSelector;
