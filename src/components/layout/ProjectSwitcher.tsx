import { useState } from 'react';
import { Check, ChevronDown, FolderOpen, FolderPlus, Plus } from 'lucide-react';
import { useProject } from '@/context/ProjectProvider';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Input';
import { DateField } from '@/components/ui/DateField';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';

export function ProjectSwitcher() {
  const { projects, project, isEverything, loading, setProject, createProject } = useProject();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [busy, setBusy] = useState(false);

  const label = loading ? '…' : (project?.name ?? 'Everything');

  const submit = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await createProject({
        name,
        start_date: start || null,
        end_date: end || null,
      });
      toast('Project created');
      setName('');
      setStart('');
      setEnd('');
      setCreating(false);
      setOpen(false);
    } catch {
      toast('Could not create project', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-full bg-surface-alt px-3 py-1.5 text-sm font-medium text-text"
      >
        <span className="max-w-[10rem] truncate">{label}</span>
        <ChevronDown size={16} className="text-text-muted" />
      </button>

      <Sheet
        open={open}
        onClose={() => {
          setOpen(false);
          setCreating(false);
        }}
        title={creating ? 'New project' : 'Projects'}
        center
      >
        {!creating ? (
          <div className="space-y-1">
            {/* Everything — global view across all projects */}
            <button
              onClick={() => {
                setProject(null);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-left hover:bg-surface-alt"
            >
              <span className="flex items-center gap-2">
                <FolderOpen size={16} className="text-text-muted" />
                <span className="text-[15px] font-medium">Everything</span>
                <span className="rounded-full bg-surface-alt px-2 py-0.5 text-xs text-text-muted">
                  all projects
                </span>
              </span>
              {isEverything && <Check size={18} className="text-primary" />}
            </button>

            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setProject(p.id);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-left hover:bg-surface-alt"
              >
                <span className="flex items-center gap-2">
                  <span className="text-[15px] font-medium">{p.name}</span>
                  {p.is_default && (
                    <span className="rounded-full bg-surface-alt px-2 py-0.5 text-xs text-text-muted">
                      default
                    </span>
                  )}
                </span>
                {!isEverything && project?.id === p.id && (
                  <Check size={18} className="text-primary" />
                )}
              </button>
            ))}

            <button
              onClick={() => setCreating(true)}
              className="mt-2 flex w-full items-center gap-2 rounded-xl border border-dashed border-border px-3.5 py-3 text-[15px] font-medium text-primary"
            >
              <FolderPlus size={18} />
              New project
            </button>
          </div>
        ) : (
          <div className="space-y-4 pb-2">
            <Field label="Name">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Spain summer 2026"
                autoFocus
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start" optional>
                <DateField value={start} onChange={setStart} />
              </Field>
              <Field label="End" optional>
                <DateField value={end} onChange={setEnd} />
              </Field>
            </div>
            <div className={cn('flex gap-2 pt-1')}>
              <Button variant="secondary" block onClick={() => setCreating(false)}>
                Back
              </Button>
              <Button block onClick={submit} disabled={busy || !name.trim()}>
                <Plus size={18} /> Create
              </Button>
            </div>
          </div>
        )}
      </Sheet>
    </>
  );
}
