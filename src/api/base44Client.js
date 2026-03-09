import localDb from '@/services/localDb';

// Export the local database as a replacement for Base44 client
export const base44 = localDb;
