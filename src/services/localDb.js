// Local fake database service using localStorage
// This replaces Base44 backend functionality

const STORAGE_KEYS = {
  USERS: 'localdb_users',
  TEAMS: 'localdb_teams',
  RUBRIQUES: 'localdb_rubriques',
  CONTENTS: 'localdb_contents',
  KANBAN: 'localdb_kanban',
  MODERATION: 'localdb_moderation',
  CURRENT_USER: 'localdb_current_user'
};

        updated_at: new Date().toISOString()
      },
      {
        id: '3',
        name: 'Actualités',
        description: 'Nouvelles et annonces',
        team_ids: ['2'], 
        color: '#16a34a',
        created_by: '2',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    localStorage.setItem(STORAGE_KEYS.CONTENTS, JSON.stringify(contents));
  }

  if (!localStorage.getItem(STORAGE_KEYS.MODERATION)) {
    const moderation = [
      {
        id: '1',
        content_id: '3',
        status: 'pending_review',
        moderator_id: null,
        reason: 'Needs review before publication',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    localStorage.setItem(STORAGE_KEYS.MODERATION, JSON.stringify(moderation));
  }

  if (!localStorage.getItem(STORAGE_KEYS.RUBRIQUES)) {
    const rubriques = [
      {
        id: '1',
        name: 'Documentation',
        description: 'Documentation et guides techniques',
        team_ids: ['1'], 
        color: '#0f766e',
        created_by: '1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Tutoriels',
        description: 'Guides pas à pas et tutoriels',
        team_ids: ['1', '2'], 
        color: '#dc2626',
        created_by: '1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '3',
        name: 'Actualités',
        description: 'Nouvelles et annonces',
        team_ids: ['2'], 
        color: '#16a34a',
        created_by: '2',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    localStorage.setItem(STORAGE_KEYS.RUBRIQUES, JSON.stringify(rubriques));
  }

  if (!localStorage.getItem(STORAGE_KEYS.KANBAN)) {
    const kanban = [
      {
        content_id: '1',
        column: 'Terminé',
        updated_at: new Date().toISOString()
      },
      {
        content_id: '2',
        column: 'Terminé',
        updated_at: new Date().toISOString()
      }
    ];
    localStorage.setItem(STORAGE_KEYS.KANBAN, JSON.stringify(kanban));
  }
};

// Generic CRUD operations
const getItems = (key) => {
  const items = localStorage.getItem(key);
  return items ? JSON.parse(items) : [];
};

const setItems = (key, items) => {
  localStorage.setItem(key, JSON.stringify(items));
};

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Users API
export const usersApi = {
  getAll: () => getItems(STORAGE_KEYS.USERS),
  getById: (id) => getItems(STORAGE_KEYS.USERS).find(user => user.id === id),
  create: (userData) => {
    const users = getItems(STORAGE_KEYS.USERS);
    const newUser = {
      id: generateId(),
      ...userData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    users.push(newUser);
    setItems(STORAGE_KEYS.USERS, users);
    return newUser;
  },
  update: (id, userData) => {
    const users = getItems(STORAGE_KEYS.USERS);
    const index = users.findIndex(user => user.id === id);
    if (index !== -1) {
      users[index] = {
        ...users[index],
        ...userData,
        updated_at: new Date().toISOString()
      };
      setItems(STORAGE_KEYS.USERS, users);
      return users[index];
    }
    return null;
  },
  delete: (id) => {
    const users = getItems(STORAGE_KEYS.USERS);
    const filteredUsers = users.filter(user => user.id !== id);
    setItems(STORAGE_KEYS.USERS, filteredUsers);
    return true;
  }
};

// Teams API
export const teamsApi = {
  getAll: () => getItems(STORAGE_KEYS.TEAMS),
  getById: (id) => getItems(STORAGE_KEYS.TEAMS).find(team => team.id === id),
  create: (teamData) => {
    const teams = getItems(STORAGE_KEYS.TEAMS);
    const newTeam = {
      id: generateId(),
      ...teamData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    teams.push(newTeam);
    setItems(STORAGE_KEYS.TEAMS, teams);
    return newTeam;
  },
  update: (id, teamData) => {
    const teams = getItems(STORAGE_KEYS.TEAMS);
    const index = teams.findIndex(team => team.id === id);
    if (index !== -1) {
      teams[index] = {
        ...teams[index],
        ...teamData,
        updated_at: new Date().toISOString()
      };
      setItems(STORAGE_KEYS.TEAMS, teams);
      return teams[index];
    }
    return null;
  },
  delete: (id) => {
    // Cascade delete: delete team, its rubriques, and its contents
    const teams = getItems(STORAGE_KEYS.TEAMS);
    const rubriques = getItems(STORAGE_KEYS.RUBRIQUES);
    const contents = getItems(STORAGE_KEYS.CONTENTS);
    const kanban = getItems(STORAGE_KEYS.KANBAN);
    
    // Delete team
    const filteredTeams = teams.filter(team => team.id !== id);
    setItems(STORAGE_KEYS.TEAMS, filteredTeams);
    
    // Delete team's rubriques
    const filteredRubriques = rubriques.filter(rub => rub.team_id !== id);
    setItems(STORAGE_KEYS.RUBRIQUES, filteredRubriques);
    
    // Delete team's contents
    const filteredContents = contents.filter(content => content.team_id !== id);
    setItems(STORAGE_KEYS.CONTENTS, filteredContents);
    
    // Delete kanban entries for team's contents
    const teamContentIds = contents.filter(content => content.team_id === id).map(content => content.id);
    const filteredKanban = kanban.filter(item => !teamContentIds.includes(item.content_id));
    setItems(STORAGE_KEYS.KANBAN, filteredKanban);
    
    return true;
  }
};

// Rubriques API
export const rubriquesApi = {
  getAll: () => getItems(STORAGE_KEYS.RUBRIQUES),
  getById: (id) => getItems(STORAGE_KEYS.RUBRIQUES).find(rubrique => rubrique.id === id),
  getByTeam: (teamId) => getItems(STORAGE_KEYS.RUBRIQUES).filter(rubrique => rubrique.team_id === teamId),
  create: (rubriqueData) => {
    const rubriques = getItems(STORAGE_KEYS.RUBRIQUES);
    const newRubrique = {
      id: generateId(),
      ...rubriqueData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    rubriques.push(newRubrique);
    setItems(STORAGE_KEYS.RUBRIQUES, rubriques);
    return newRubrique;
  },
  update: (id, rubriqueData) => {
    const rubriques = getItems(STORAGE_KEYS.RUBRIQUES);
    const index = rubriques.findIndex(rubrique => rubrique.id === id);
    if (index !== -1) {
      rubriques[index] = {
        ...rubriques[index],
        ...rubriqueData,
        updated_at: new Date().toISOString()
      };
      setItems(STORAGE_KEYS.RUBRIQUES, rubriques);
      return rubriques[index];
    }
    return null;
  },
  delete: (id) => {
    const rubriques = getItems(STORAGE_KEYS.RUBRIQUES);
    const filteredRubriques = rubriques.filter(rubrique => rubrique.id !== id);
    setItems(STORAGE_KEYS.RUBRIQUES, filteredRubriques);
    return true;
  }
};

// Contents API
export const contentsApi = {
  getAll: () => getItems(STORAGE_KEYS.CONTENTS),
  getById: (id) => getItems(STORAGE_KEYS.CONTENTS).find(content => content.id === id),
  getByAuthor: (authorId) => getItems(STORAGE_KEYS.CONTENTS).filter(content => content.author_id === authorId),
  getByTeam: (teamId) => getItems(STORAGE_KEYS.CONTENTS).filter(content => content.team_id === teamId),
  create: (contentData) => {
    const contents = getItems(STORAGE_KEYS.CONTENTS);
    const newContent = {
      id: generateId(),
      ...contentData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    contents.push(newContent);
    setItems(STORAGE_KEYS.CONTENTS, contents);
    return newContent;
  },
  update: (id, contentData) => {
    const contents = getItems(STORAGE_KEYS.CONTENTS);
    const index = contents.findIndex(content => content.id === id);
    if (index !== -1) {
      contents[index] = {
        ...contents[index],
        ...contentData,
        updated_at: new Date().toISOString()
      };
      setItems(STORAGE_KEYS.CONTENTS, contents);
      return contents[index];
    }
    return null;
  },
  delete: (id) => {
    const contents = getItems(STORAGE_KEYS.CONTENTS);
    const filteredContents = contents.filter(content => content.id !== id);
    setItems(STORAGE_KEYS.CONTENTS, filteredContents);
    return true;
  }
};

// Kanban API
export const kanbanApi = {
  getAll: () => getItems(STORAGE_KEYS.KANBAN),
  getByContent: (contentId) => getItems(STORAGE_KEYS.KANBAN).find(item => item.content_id === contentId),
  updateColumn: (contentId, column) => {
    const kanban = getItems(STORAGE_KEYS.KANBAN);
    const index = kanban.findIndex(item => item.content_id === contentId);
    
    if (index !== -1) {
      kanban[index] = {
        ...kanban[index],
        column,
        updated_at: new Date().toISOString()
      };
    } else {
      kanban.push({
        content_id: contentId,
        column,
        updated_at: new Date().toISOString()
      });
    }
    
    setItems(STORAGE_KEYS.KANBAN, kanban);
    return true;
  },
  delete: (contentId) => {
    const kanban = getItems(STORAGE_KEYS.KANBAN);
    const filteredKanban = kanban.filter(item => item.content_id !== contentId);
    setItems(STORAGE_KEYS.KANBAN, filteredKanban);
    return true;
  }
};

// Moderation API
export const moderationApi = {
  getAll: () => getItems(STORAGE_KEYS.MODERATION),
  getById: (id) => getItems(STORAGE_KEYS.MODERATION).find(mod => mod.id === id),
  getByContent: (contentId) => getItems(STORAGE_KEYS.MODERATION).filter(mod => mod.content_id === contentId),
  create: (moderationData) => {
    const moderation = getItems(STORAGE_KEYS.MODERATION);
    const newModeration = {
      id: generateId(),
      ...moderationData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    moderation.push(newModeration);
    setItems(STORAGE_KEYS.MODERATION, moderation);
    return newModeration;
  },
  update: (id, moderationData) => {
    const moderation = getItems(STORAGE_KEYS.MODERATION);
    const index = moderation.findIndex(mod => mod.id === id);
    if (index !== -1) {
      moderation[index] = {
        ...moderation[index],
        ...moderationData,
        updated_at: new Date().toISOString()
      };
      setItems(STORAGE_KEYS.MODERATION, moderation);
      return moderation[index];
    }
    return null;
  },
  delete: (id) => {
    const moderation = getItems(STORAGE_KEYS.MODERATION);
    const filteredModeration = moderation.filter(mod => mod.id !== id);
    setItems(STORAGE_KEYS.MODERATION, filteredModeration);
    return true;
  }
};

// Auth API (mock)
export const authApi = {
  me: () => {
    const currentUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (currentUser) {
      return JSON.parse(currentUser);
    }
    // Return default user if no current user
    return usersApi.getById('1');
  },
  login: async (email, password) => {
    // Mock login - find user by email
    const users = getItems(STORAGE_KEYS.USERS);
    console.log('All users in localStorage:', users);
    console.log('Looking for email:', email);
    
    const user = users.find(u => u.email === email);
    console.log('Found user:', user);
    
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      return user;
    }
    throw new Error('Invalid credentials');
  },
  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },
  redirectToLogin: (returnUrl) => {
    // In a real app, this would redirect to login page
    console.log('Redirect to login with return URL:', returnUrl);
  }
};

// Helper function to force reinitialize data (for debugging)
export const reinitializeData = () => {
  console.log('Reinitializing all localStorage data...');
  localStorage.clear();
  initializeData();
  console.log('Data reinitialized with default users');
};

// Initialize database
initializeData();

// Migration function to convert old team_id to team_ids
const migrateToMultiTeams = () => {
  console.log('Starting migration to multi-teams format...');
  
  // Migrate rubriques
  const rubriques = getItems(STORAGE_KEYS.RUBRIQUES);
  let rubriquesMigrated = false;
  
  const updatedRubriques = rubriques.map(rubrique => {
    if (rubrique.team_id && !rubrique.team_ids) {
      rubriquesMigrated = true;
      return {
        ...rubrique,
        team_ids: [rubrique.team_id],
        team_id: undefined // Remove old field
      };
    }
    return rubrique;
  });
  
  if (rubriquesMigrated) {
    setItems(STORAGE_KEYS.RUBRIQUES, updatedRubriques);
    console.log('Rubriques migrated to multi-teams format');
  }
  
  // Migrate contents
  const contents = getItems(STORAGE_KEYS.CONTENTS);
  let contentsMigrated = false;
  
  const updatedContents = contents.map(content => {
    if (content.team_id && !content.team_ids) {
      contentsMigrated = true;
      return {
        ...content,
        team_ids: [content.team_id],
        team_id: undefined // Remove old field
      };
    }
    return content;
  });
  
  if (contentsMigrated) {
export const localDb = {
  users: { getAll: () => Promise.resolve([]) },
  teams: { getAll: () => Promise.resolve([]) },
  rubriques: { getAll: () => Promise.resolve([]) },
  contents: { getAll: () => Promise.resolve([]) },
  kanban: { getAll: () => Promise.resolve([]) },
  moderation: { getAll: () => Promise.resolve([]) },
  auth: { 
    me: () => Promise.reject(new Error('Auth should use real API in production'))
  },
  integrations: {
    Core: {
      UploadFile: () => Promise.reject(new Error('Upload should use real API in production'))
    }
  }
};

// Helper function to inspect localStorage (for debugging)
export const inspectLocalStorage = () => {
console.log('=== LOCAL STORAGE INSPECTION ===');
console.log('Users:', JSON.parse(localStorage.getItem('localdb_users') || '[]'));
console.log('Current user:', JSON.parse(localStorage.getItem('localdb_current_user') || 'null'));
console.log('All localStorage keys:', Object.keys(localStorage));
console.log('====================================');
};

// Clear all localDb data from localStorage
export const clearAllLocalData = () => {
console.log(' Clearing all localDb data from localStorage...');
Object.values(STORAGE_KEYS).forEach(key => {
localStorage.removeItem(key);
console.log(` Removed ${key}`);
});
console.log(' All localDb data cleared');
};

export default localDb;
