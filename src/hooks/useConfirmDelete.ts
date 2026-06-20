import { useProject } from '@/context/ProjectProvider';

/** Returns a guard that respects the confirm-before-delete setting. */
export function useConfirmDelete() {
  const { settings } = useProject();
  return (message = 'Delete this entry?') => {
    if (!settings.confirm_before_delete) return true;
    return window.confirm(message);
  };
}
