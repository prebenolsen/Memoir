import { supabase } from './supabase';

// Tables included in backups, in dependency order (items + projects before entries).
const ITEM_TABLES = [
  'memoir_food_items',
  'memoir_restaurants',
  'memoir_drink_items',
  'memoir_activity_items',
] as const;
const ENTRY_TABLES = [
  'memoir_food_entries',
  'memoir_drink_entries',
  'memoir_activity_entries',
  'memoir_purchase_entries',
] as const;

export interface BackupFile {
  app: 'memoir';
  version: 1;
  exported_at: string;
  scope: 'all' | 'project';
  project_id?: string;
  tables: Record<string, Record<string, unknown>[]>;
}

function download(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function selectAll(table: string, projectId?: string) {
  let q = supabase.from(table).select('*');
  if (projectId) q = q.eq('project_id', projectId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Record<string, unknown>[];
}

/** Full account backup. */
export async function exportAll() {
  const tables: BackupFile['tables'] = {};
  tables['memoir_projects'] = await selectAll('memoir_projects');
  tables['memoir_settings'] = await selectAll('memoir_settings');
  for (const t of ITEM_TABLES) tables[t] = await selectAll(t);
  for (const t of ENTRY_TABLES) tables[t] = await selectAll(t);
  const file: BackupFile = {
    app: 'memoir',
    version: 1,
    exported_at: new Date().toISOString(),
    scope: 'all',
    tables,
  };
  download(`memoir-backup-${new Date().toISOString().slice(0, 10)}.json`, file);
}

/** Export a single project (its entries + all reusable items). */
export async function exportProject(projectId: string, projectName: string) {
  const tables: BackupFile['tables'] = {};
  tables['memoir_projects'] = (await selectAll('memoir_projects')).filter((p) => p.id === projectId);
  for (const t of ITEM_TABLES) tables[t] = await selectAll(t);
  for (const t of ENTRY_TABLES) tables[t] = await selectAll(t, projectId);
  const file: BackupFile = {
    app: 'memoir',
    version: 1,
    exported_at: new Date().toISOString(),
    scope: 'project',
    project_id: projectId,
    tables,
  };
  const safe = projectName.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  download(`memoir-${safe}-${new Date().toISOString().slice(0, 10)}.json`, file);
}

/** Import a backup file, upserting rows. Rebinds ownership to the current user. */
export async function importData(file: File, userId: string): Promise<void> {
  const text = await file.text();
  const parsed = JSON.parse(text) as BackupFile;
  if (parsed.app !== 'memoir') throw new Error('Not a Memoir backup file.');

  const order = ['memoir_projects', 'memoir_settings', ...ITEM_TABLES, ...ENTRY_TABLES];
  for (const table of order) {
    const rows = parsed.tables[table];
    if (!rows?.length) continue;
    const withOwner = rows.map((r) => ({ ...r, user_id: userId }));
    const conflict = table === 'memoir_settings' ? 'user_id' : 'id';
    const { error } = await supabase.from(table).upsert(withOwner, { onConflict: conflict });
    if (error) throw error;
  }
}

export async function deleteProject(projectId: string): Promise<void> {
  // Entry tables cascade via FK on project delete.
  const { error } = await supabase.from('memoir_projects').delete().eq('id', projectId);
  if (error) throw error;
}

/**
 * Permanently delete the signed-in user's account and all their data.
 * Delegates to a SECURITY DEFINER RPC so it can remove the auth.users row,
 * which is not accessible from the client SDK.
 */
export async function deleteAccount(): Promise<void> {
  const { error } = await supabase.rpc('memoir_delete_account');
  if (error) throw error;
}
