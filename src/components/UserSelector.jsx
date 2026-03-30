import React, { useState, useEffect } from 'react';
import { X, Search, User } from 'lucide-react';

const UserSelector = ({ selectedUsers = [], onUsersChange, disabled = false }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

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
        
        // Get the API base URL
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
            <span>{user.name || user.email}</span>
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
              onFocus={() => setIsOpen(true)}
              placeholder="Rechercher des utilisateurs..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Search results dropdown */}
          {isOpen && (searchQuery.trim().length >= 2) && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {isSearching ? (
                <div className="p-3 text-gray-500 text-center">
                  Recherche en cours...
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-3 text-gray-500 text-center">
                  Aucun utilisateur trouvé
                </div>
              ) : (
                searchResults.map((user) => (
                  <div
                    key={user._id}
                    onClick={() => addUser(user)}
                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {user.name || 'Utilisateur sans nom'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
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
      </p>
    </div>
  );
};

export default UserSelector;
