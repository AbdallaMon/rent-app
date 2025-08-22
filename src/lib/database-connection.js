// Database connection utility functions for Next.js
import { PrismaClient } from '@prisma/client';

// Create a global prisma instance to avoid multiple connections
const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Execute a function with write connection to database
 * @param {Function} callback - Function to execute with prisma client
 * @returns {Promise} Result of the callback function
 */
export async function withWriteConnection(callback) {
  try {
    return await callback(prisma);
  } catch (error) {
    console.error('Database write operation error:', error);
    throw error;
  }
}

/**
 * Execute a function with read-only connection to database
 * @param {Function} callback - Function to execute with prisma client
 * @returns {Promise} Result of the callback function
 */
export async function withReadOnlyConnection(callback) {
  try {
    return await callback(prisma);
  } catch (error) {
    console.error('Database read operation error:', error);
    throw error;
  }
}

/**
 * Execute a function with database connection (alias for compatibility)
 * @param {Function} callback - Function to execute with prisma client
 * @returns {Promise} Result of the callback function
 */
export async function withDatabaseConnection(callback) {
  return withWriteConnection(callback);
}

export default prisma;
