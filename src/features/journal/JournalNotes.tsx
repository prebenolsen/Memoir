import { useLayoutEffect, useRef, useState } from 'react';
import { NotebookPen, Trash2 } from 'lucide-react';
import { useProject } from '@/context/ProjectProvider';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import { newId } from '@/lib/format';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { JournalEntry } from '@/types/db';
import { useJournalNotes, useJournalNoteMutations } from './hooks/useJournalNotes';

/** Grow a textarea to fit its content as the user types. */
function useAutosize(value: string) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return ref;
}

function noteTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** An existing note: editable in place, saved explicitly, deletable. */
function NoteCard({
  note,
  onSave,
  onDelete,
}: {
  note: JournalEntry;
  onSave: (note: JournalEntry, body: string) => void;
  onDelete: (note: JournalEntry) => void;
}) {
  const [draft, setDraft] = useState(note.body);
  const ref = useAutosize(draft);
  const trimmed = draft.trim();
  const dirty = trimmed.length > 0 && trimmed !== note.body.trim();

  return (
    <Card className="space-y-2 p-3">
      <Textarea
        ref={ref}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        aria-label="Journal note"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-muted">{noteTime(note.created_at)}</span>
        <div className="flex items-center gap-2">
          {dirty && (
            <Button size="sm" variant="ghost" onClick={() => setDraft(note.body)}>
              Discard
            </Button>
          )}
          {dirty && (
            <Button size="sm" onClick={() => onSave(note, trimmed)}>
              Save
            </Button>
          )}
          <button
            onClick={() => onDelete(note)}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-text-muted hover:bg-surface-alt hover:text-danger"
            aria-label="Delete note"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </Card>
  );
}

/** Empty composer for adding a new note to the day. */
function NoteComposer({ onAdd }: { onAdd: (body: string) => void }) {
  const [draft, setDraft] = useState('');
  const ref = useAutosize(draft);
  const canAdd = draft.trim().length > 0;

  const add = () => {
    if (!canAdd) return;
    onAdd(draft.trim());
    setDraft('');
  };

  return (
    <Card className="space-y-2 p-3">
      <Textarea
        ref={ref}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Write about your day — how you felt, what you did, the gym, anything…"
        aria-label="New journal note"
      />
      <div className="flex justify-end">
        <Button size="sm" onClick={add} disabled={!canAdd}>
          Add note
        </Button>
      </div>
    </Card>
  );
}

/**
 * Freetext journal notes for the current day, shown at the bottom of the Journal
 * page. Notes are stored verbatim (pure text) and strongly owned by the user.
 */
export function JournalNotes() {
  const { viewProjectId, activeProject, date } = useProject();
  const { data: notes = [] } = useJournalNotes(viewProjectId, date);
  const { save, remove } = useJournalNoteMutations();
  const confirmDelete = useConfirmDelete();

  const add = (body: string) => {
    if (!activeProject) return;
    void save(newId(), { project_id: activeProject.id, entry_date: date, body });
  };
  const edit = (note: JournalEntry, body: string) =>
    void save(note.id, { project_id: note.project_id, entry_date: note.entry_date, body });
  const del = async (note: JournalEntry) => {
    if (confirmDelete('Delete this note?')) await remove(note.id);
  };

  return (
    <section>
      <SectionTitle icon={<NotebookPen size={15} />}>Notes</SectionTitle>
      <div className="space-y-3">
        {notes.map((n) => (
          <NoteCard key={n.id} note={n} onSave={edit} onDelete={del} />
        ))}
        <NoteComposer onAdd={add} />
      </div>
    </section>
  );
}
