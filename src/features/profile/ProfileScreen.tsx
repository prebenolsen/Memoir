import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Download,
  Upload,
  Trash2,
  DatabaseBackup,
  LogOut,
  UserPlus,
  Check,
  X,
  Users,
} from 'lucide-react';
import { useSettings } from '@/context/SettingsProvider';
import { useProject } from '@/context/ProjectProvider';
import { useAuth } from '@/context/AuthProvider';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { useFriends } from '@/hooks/useFriends';
import { FriendDetailSheet, type FriendRef } from '@/features/explore/FriendFavorites';
import { useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Toggle } from '@/components/ui/Toggle';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from '@/components/ui/Toast';
import { exportAll, exportProject, importData, deleteProject, deleteAccount } from '@/lib/dataTransfer';
import versionRaw from '../../../VERSION.md?raw';
import type { Currency, DateFormat, FirstDayOfWeek, RatingScale, Theme } from '@/types/db';

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

function UsernameCard() {
  const { profile, setUsername, saving } = useProfile();
  const [value, setValue] = useState('');

  useEffect(() => {
    setValue(profile?.username ?? '');
  }, [profile?.username]);

  const dirty = value.trim() !== (profile?.username ?? '');

  const save = async () => {
    try {
      await setUsername(value);
      toast('Username saved');
    } catch (e) {
      toast((e as Error)?.message ?? 'Could not save username', 'error');
    }
  };

  return (
    <Card className="space-y-2 p-4">
      <p className="text-sm text-text-muted">
        Your username — this is how friends find and add you. Change it anytime.
      </p>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder=""
          autoCapitalize="none"
          autoCorrect="off"
        />
        <Button onClick={save} disabled={!dirty || !value.trim() || saving}>
          Save
        </Button>
      </div>
    </Card>
  );
}

function FriendsCard() {
  const { settings } = useSettings();
  const { friends, incoming, outgoing, addFriend, adding, acceptRequest, removeFriend } =
    useFriends();
  const [identifier, setIdentifier] = useState('');
  const [detail, setDetail] = useState<FriendRef | null>(null);

  const submitAdd = async () => {
    try {
      await addFriend(identifier);
      setIdentifier('');
      toast('Friend request sent');
    } catch (e) {
      toast((e as Error)?.message ?? 'Could not send request', 'error');
    }
  };

  return (
    <div className="space-y-3">
      <Card className="space-y-2 p-4">
        <p className="text-sm text-text-muted">Add a friend by their username.</p>
        <div className="flex gap-2">
          <Input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder=""
            autoCapitalize="none"
            autoCorrect="off"
            onKeyDown={(e) => e.key === 'Enter' && submitAdd()}
          />
          <Button onClick={submitAdd} disabled={adding || !identifier.trim()}>
            <UserPlus size={18} /> Add
          </Button>
        </div>
      </Card>

      {incoming.length > 0 && (
        <Card>
          <p className="px-4 pt-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
            Requests
          </p>
          {incoming.map((f) => (
            <div
              key={f.friendshipId}
              className="flex items-center justify-between gap-2 border-t border-border px-4 py-3"
            >
              <span className="truncate text-[15px]">{f.username ? `@${f.username}` : (f.email ?? 'unknown')}</span>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => acceptRequest(f.friendshipId).then(() => toast('Friend added'))}>
                  <Check size={16} /> Accept
                </Button>
                <Button size="sm" variant="secondary" onClick={() => removeFriend(f.friendshipId)}>
                  <X size={16} />
                </Button>
              </div>
            </div>
          ))}
        </Card>
      )}

      <Card>
        {friends.length === 0 && outgoing.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-text-muted">
            <Users className="mx-auto mb-1 opacity-50" size={20} />
            No friends yet.
          </p>
        ) : (
          <>
            {friends.map((f) => (
              <div
                key={f.friendshipId}
                className="flex items-center justify-between gap-2 border-t border-border px-4 py-3 first:border-t-0"
              >
                <button
                  onClick={() =>
                    setDetail({ userId: f.userId, username: f.username, email: f.email })
                  }
                  className="min-w-0 flex-1 truncate text-left text-[15px]"
                >
                  {f.username ? `@${f.username}` : (f.email ?? 'unknown')}
                </button>
                <button
                  onClick={() => removeFriend(f.friendshipId)}
                  className="shrink-0 text-sm text-text-muted hover:text-danger"
                >
                  Remove
                </button>
              </div>
            ))}
            {outgoing.map((f) => (
              <div
                key={f.friendshipId}
                className="flex items-center justify-between gap-2 border-t border-border px-4 py-3 first:border-t-0"
              >
                <span className="truncate text-[15px] text-text-muted">
                  {f.username ? `@${f.username}` : (f.email ?? 'unknown')} · pending
                </span>
                <button
                  onClick={() => removeFriend(f.friendshipId)}
                  className="text-sm text-text-muted hover:text-danger"
                >
                  Cancel
                </button>
              </div>
            ))}
          </>
        )}
      </Card>

      <FriendDetailSheet
        friend={detail}
        scale={settings.rating_scale}
        onClose={() => setDetail(null)}
      />
    </div>
  );
}

export function ProfileScreen() {
  const { settings, update } = useSettings();
  const { activeProject, projects, refetchProjects, setProject } = useProject();
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
    if (!activeProject) return;
    try {
      await exportProject(activeProject.id, activeProject.name);
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

  const doDeleteAccount = async () => {
    if (
      !window.confirm(
        'Delete your account?\n\nThis permanently erases your profile, all projects, every entry, and all settings. There is no undo and no recovery.',
      )
    )
      return;
    setBusy(true);
    try {
      await deleteAccount();
      await signOut();
      navigate('/');
    } catch {
      toast('Could not delete account — please try again or contact support', 'error');
    } finally {
      setBusy(false);
    }
  };

  const doDeleteProject = async () => {
    if (!activeProject) return;
    if (activeProject.is_default) {
      toast('The default project cannot be deleted', 'error');
      return;
    }
    if (
      settings.confirm_before_delete &&
      !window.confirm(`Delete project "${activeProject.name}" and all its entries? This cannot be undone.`)
    )
      return;
    setBusy(true);
    try {
      await deleteProject(activeProject.id);
      const next = projects.find((p) => p.id !== activeProject.id);
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
      <h1 className="mb-3 font-serif text-2xl font-semibold">Profile</h1>

      <GroupTitle>Username</GroupTitle>
      <UsernameCard />

      <GroupTitle>Friends</GroupTitle>
      <FriendsCard />

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
        <Button block variant="secondary" onClick={doExportProject} disabled={busy || !activeProject}>
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
        <Button block variant="danger" onClick={doDeleteProject} disabled={busy || !activeProject || activeProject.is_default}>
          <Trash2 size={18} /> Delete current project
        </Button>
      </Card>

      <GroupTitle>Account</GroupTitle>
      <Card className="space-y-2 p-4">
        <Button block variant="secondary" onClick={() => signOut().then(() => navigate('/'))}>
          <LogOut size={18} /> Sign out
        </Button>
        <Button block variant="danger" onClick={doDeleteAccount} disabled={busy}>
          <Trash2 size={18} /> Delete my account
        </Button>
      </Card>

      <p className="px-1 pt-4 text-center text-xs text-text-muted">
        Memoir v{versionRaw.trim()} · {user?.email}
      </p>
    </div>
  );
}
