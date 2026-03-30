import React, { useState, useEffect } from 'react';
import { X, Search, User } from 'lucide-react';
import { gazettesAPI } from '../services/api';

const UserSelector = ({ selectedUsers = [], onUsersChange, disabled = false }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Search users
  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await gazettesAPI.searchUsers(searchQuery);
        if (response.success && response.data) {
          setSearchResults(response.data);
        }
      } catch (error) {
        console.error('Error searching users:', error);
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
    if (!selectedUsers.find(u => u._id === user._id)) {
      onUsersChange([...selectedUsers, user]);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  // Remove user from selection
  const removeUser = (userId) => {
    onUsersChange(selectedUsers.filter(u => u._id !== userId));
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
