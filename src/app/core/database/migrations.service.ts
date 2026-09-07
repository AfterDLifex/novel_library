import { Injectable, inject } from '@angular/core';
import { db } from './indexed-db.service';

/**
 * Handles database schema migrations.
 * Each migration transforms the data from the previous version to the current one.
 */
@Injectable({ providedIn: 'root' })
export class MigrationsService {
  private readonly migrations: Migration[] = [
    {
      version: 1,
      description: 'Initial schema',
      up: async () => {
        // Initial schema is created by Dexie's .version(1).stores() call
      },
    },
    {
      version: 2,
      description: 'Add search metadata columns',
      up: async (database: typeof db) => {
        // Add new indexes if needed in future versions
        // This migration is a placeholder for future schema changes
      },
    },
  ];

  async runMigrations(): Promise<void> {
    const settings = await db.settings.toCollection().first();
    const schemaVersion = settings?.schemaVersion ?? 0;

    for (const migration of this.migrations) {
      if (migration.version > schemaVersion) {
        await migration.up(db);
        if (settings) {
          await db.settings.update(settings.deviceId, { schemaVersion: migration.version });
        }
      }
    }
  }

  getCurrentSchemaVersion(): number {
    // The latest migration version
    return Math.max(...this.migrations.map((m) => m.version));
  }
}

interface Migration {
  version: number;
  description: string;
  up: (database: typeof db) => Promise<void>;
}
