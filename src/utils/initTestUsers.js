// Initialize test users for development
const initializeTestUsers = () => {
  const existingUsers = localStorage.getItem('users');
  
  if (!existingUsers) {
    const testUsers = [
      {
        id: '1',
        name: 'Admin User',
        email: 'admin@echo.com',
        password: 'admin123',
        role: 'ADMIN',
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Jean Dupont',
        email: 'jean@echo.com',
        password: 'user123',
        role: 'MEMBER',
        createdAt: new Date().toISOString()
      },
      {
        id: '3',
        name: 'Marie Curie',
        email: 'marie@echo.com',
        password: 'user123',
        role: 'MEMBER',
        createdAt: new Date().toISOString()
      }
    ];
    
    localStorage.setItem('users', JSON.stringify(testUsers));
    console.log('Test users initialized:', testUsers);
  }
};

// Initialize on app load
initializeTestUsers();

export default initializeTestUsers;
