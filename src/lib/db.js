import Database from 'better-sqlite3';
import path from 'path';

let db;
let isLocked = false;
const queue = [];

async function acquireLock() {
  if (!isLocked) {
    isLocked = true;
    return;
  }
  return new Promise(resolve => queue.push(resolve));
}

function releaseLock() {
  if (queue.length > 0) {
    const next = queue.shift();
    next();
  } else {
    isLocked = false;
  }
}

export async function getDbConnection() {
  if (!db) {
    const dbPath = path.join(process.cwd(), 'estate.db');

    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');

    // Mock MySQL pool.getConnection()
    db.getConnection = async () => {
      await acquireLock();
      let inTransaction = false;
      return {
        beginTransaction: async () => {
          db.exec('BEGIN');
          inTransaction = true;
        },
        commit: async () => {
          if (inTransaction) {
            db.exec('COMMIT');
            inTransaction = false;
          }
          releaseLock();
        },
        rollback: async () => {
          if (inTransaction) {
            db.exec('ROLLBACK');
            inTransaction = false;
          }
          releaseLock();
        },
        release: () => {
          if (inTransaction) {
            db.exec('ROLLBACK');
            inTransaction = false;
          }
          releaseLock();
        },
        execute: async (sql, params = []) => {
          // Normalize to array
          const bindParams = Array.isArray(params) ? params : [params];
          const stmt = db.prepare(sql);
          if (sql.trim().toUpperCase().startsWith('SELECT') || sql.trim().toUpperCase().startsWith('PRAGMA')) {
            const results = stmt.all(...bindParams);
            return [results]; // MySQL returns [rows, fields]
          } else {
            const result = stmt.run(...bindParams);
            return [{
              insertId: result.lastInsertRowid,
              affectedRows: result.changes,
              ...result
            }];
          }
        }
      };
    };
  }
  return db;
}

// Helper utility to run query directly
// Retaining async keyword to ensure compatibility with existing await calls
export async function query(sql, params = []) {
  const connection = await getDbConnection();
  try {
    const stmt = connection.prepare(sql);
    // Ensure params is an array for spreading
    const bindParams = Array.isArray(params) ? params : [params];
    
    // SQLite distinguishes between returning rows (.all) and writing data (.run)
    if (sql.trim().toUpperCase().startsWith('SELECT') || sql.trim().toUpperCase().startsWith('PRAGMA')) {
      return stmt.all(...bindParams);
    } else {
      const result = stmt.run(...bindParams);
      // Normalize SQLite result to match MySQL expected structure
      return {
        insertId: result.lastInsertRowid,
        affectedRows: result.changes,
        ...result
      };
    }
  } catch (error) {
    console.error('DB Query Error on SQL:', sql, '\nParams:', params, '\nError:', error);
    throw error;
  }
}
