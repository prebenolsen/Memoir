import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Upload,
  Trash2,
  DatabaseBackup,
  LogOut,
} from 'lucide-react';
import { useSettings } from '@/context/SettingsProvider';
import { useProject } from '@/context/ProjectProvider';
import { useAuth } from '@/context/AuthProvider';
import { useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Toggle } from '@/components/ui/Toggle';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import { exportAll, exportProject, importData, deleteProject } from '@/lib/dataTransfer';
import type {
  Currency,
  DateFormat,
  FirstDayOfWeek,
  RatingScale,
  Theme,
} from '@/types/db';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 first:border-t-0">
      <span className="text-[15px]">{label}</span>
      {children}
    </div>
  );
}

function GroupTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 mt-5 px-1 text-sm font-semibold uppercase tracking-wide text-text-muted">
      {children}
    </h2>
  );
}

export function SettingsScreen() {
  const { settings, update } = useSettings();
  const { project, projects, refetchProjects, setProject } = useProject();
  const { user, signOut } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const doExportAll = async () => {
    try {
      await exportAll();
      toast('Backup downloaded');
    } catch {
      toast('Export failed', 'error');
    }
  };

  const doExportProject = async () => {
    if (!project) return;
    try {
      await exportProject(project.id, project.name);
      toast('Project exported');
    } catch {
      toast('Export failed', 'error');
    }
  };

  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setBusy(true);
    try {
      await importData(file, user.id);
      await qc.invalidateQueries();
      refetchProjects();
      toast('Data imported');
    } catch (err) {
      toast((err as Error)?.message ?? 'Import failed', 'error');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const doDeleteProject = async () => {
    if (!project) return;
    if (project.is_default) {
      toast('The default project cannot be deleted', 'error');
      return;
    }
    if (settings.confirm_before_delete && !window.confirm(`Delete project "${project.name}" and all its entries? This cannot be undone.`))
      return;
    setBusy(true);
    try {
      await deleteProject(project.id);
      const next = projects.find((p) => p.id !== project.id);
      if (next) setProject(next.id);
      refetchProjects();
      await qc.invalidateQueries();
      toast('Project deleted');
    } catch {
      toast('Delete failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-1 pb-6">
      <div className="mb-3 flex items-center gap-2">
        <Link
          to="/stats"
          className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface-alt"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-serif text-2xl font-semibold">Settings</h1>
      </div>

      <GroupTitle>General</GroupTitle>
      <Card>
        <Row label="Date format">
          <Select<DateFormat>
            value={settings.date_format}
            onChange={(v) => update({ date_format: v })}
            options={[
              { value: 'DD.MM.YYYY', label: 'DD.MM.YYYY' },
              { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
              { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
            ]}
          />
        </Row>
        <Row label="Currency">
          <Select<Currency>
            value={settings.currency}
            onChange={(v) => update({ currency: v })}
            options={[
              { value: 'NOK', label: 'NOK' },
              { value: 'EUR', label: 'EUR' },
              { value: 'USD', label: 'USD' },
              { value: 'Other', label: 'Other' },
            ]}
          />
        </Row>
        <Row label="Rating scale">
          <Select<string>
            value={String(settings.rating_scale)}
            onChange={(v) => update({ rating_scale: Number(v) as RatingScale })}
            options={[
              { value: '5', label: '1–5' },
              { value: '10', label: '1–10' },
            ]}
          />
        </Row>
        <Row label="First day of week">
          <Select<FirstDayOfWeek>
            value={settings.first_day_of_week}
            onChange={(v) => update({ first_day_of_week: v })}
            options={[
              { value: 'monday', label: 'Monday' },
              { value: 'sunday', label: 'Sunday' },
            ]}
          />
        </Row>
        <Row label="Theme">
          <Select<Theme>
            value={settings.theme}
            onChange={(v) => update({ theme: v })}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'system', label: 'System' },
            ]}
          />
        </Row>
      </Card>

      <GroupTitle>App behavior</GroupTitle>
      <Card>
        <Row label="Remember last project">
          <Toggle
            checked={settings.remember_last_project}
            onChange={(v) => update({ remember_last_project: v })}
          />
        </Row>
        <Row label="Remember last date">
          <Toggle
            checked={settings.remember_last_date}
            onChange={(v) => update({ remember_last_date: v })}
          />
        </Row>
        <Row label="Confirm before deleting">
          <Toggle
            checked={settings.confirm_before_delete}
            onChange={(v) => update({ confirm_before_delete: v })}
          />
        </Row>
      </Card>

      <GroupTitle>Data</GroupTitle>
      <Card className="space-y-2 p-4">
        <Button block variant="secondary" onClick={doExportProject} disabled={busy}>
          <Download size={18} /> Export current project
        </Button>
        <Button block variant="secondary" onClick={doExportAll} disabled={busy}>
          <DatabaseBackup size={18} /> Backup all data
        </Button>
        <Button block variant="secondary" onClick={() => fileRef.current?.click()} disabled={busy}>
          <Upload size={18} /> Import data
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={onImportFile}
        />
        <Button block variant="danger" onClick={doDeleteProject} disabled={busy || !!project?.is_default}>
          <Trash2 size={18} /> Delete current project
        </Button>
      </Card>

      <GroupTitle>Account</GroupTitle>
      <Card className="p-4">
        <Button block variant="ghost" onClick={() => signOut().then(() => navigate('/'))}>
          <LogOut size={18} /> Sign out
        </Button>
      </Card>

      <p className="px-1 pt-4 text-center text-xs text-text-muted">Memoir · {user?.email}</p>
    </div>
  );
}
