import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthProvider';
import { useSettings } from './SettingsProvider';
import { effectiveSettings, newId, todayISO } from '@/lib/format';
import type { Currency, Project, Settings } from '@/types/db';

interface ProjectContextValue {
  projects: Project[];
  /** Currently displayed project. null = "Everything" view or still loading. */
  project: Project | null;
  /**
   * The project used for new entries. When viewing "Everything", this is the
   * default project (so entries always belong to a real project).
   */
  activeProject: Project | null;
  /** True when the user has explicitly chosen the "Everything" view. */
  isEverything: boolean;
  /**
   * Ready-to-use project ID for useDay:
   *   undefined = still loading (query should be disabled)
   *   null      = Everything mode (query all projects)
   *   string    = specific project
   */
  viewProjectId: string | null | undefined;
  /** Settings with the active project's override applied. */
  settings: Settings;
  date: string;
  loading: boolean;
  setProject: (id: string | null) => void;
  setDate: (iso: string) => void;
  createProject: (input: {
    name: string;
    start_date?: string | null;
    end_date?: string | null;
    /** Currency for this project; stored as a settings override. */
    currency?: Currency | null;
  }) => Promise<Project>;
  refetchProjects: () => void;
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { settings, update: updateSettings } = useSettings();
  const qc = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('memoir_projects')
        .select('*')
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as Project[];
    },
  });

  const [projectId, setProjectId] = useState<string | null>(null);
  const [isEverythingMode, setIsEverythingMode] = useState(false);
  const [date, setDateState] = useState<string>(todayISO());

  // Initialise selection once projects + settings are known.
  useEffect(() => {
    if (!projects.length) return;
    if (isEverythingMode) return;
    if (projectId && projects.some((p) => p.id === projectId)) return;
    const remembered =
      settings.remember_last_project && settings.last_project_id
        ? projects.find((p) => p.id === settings.last_project_id)
        : undefined;
    const fallback = projects.find((p) => p.is_default) ?? projects[0];
    setProjectId((remembered ?? fallback).id);
  }, [projects, projectId, isEverythingMode, settings.remember_last_project, settings.last_project_id]);

  // Restore last date once on load if the user opted in.
  useEffect(() => {
    if (settings.remember_last_date && settings.last_date) {
      setDateState(settings.last_date);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.remember_last_date]);

  const setProject = (id: string | null) => {
    if (id === null) {
      setIsEverythingMode(true);
      setProjectId(null);
    } else {
      setIsEverythingMode(false);
      setProjectId(id);
      if (settings.remember_last_project) void updateSettings({ last_project_id: id });
    }
  };

  const setDate = (iso: string) => {
    setDateState(iso);
    if (settings.remember_last_date) void updateSettings({ last_date: iso });
  };

  const createProject: ProjectContextValue['createProject'] = async (input) => {
    const row = {
      id: newId(),
      user_id: user!.id,
      name: input.name.trim(),
      start_date: input.start_date ?? null,
      end_date: input.end_date ?? null,
      is_default: false,
      settings_override: input.currency ? { currency: input.currency } : null,
    };
    const { data, error } = await supabase
      .from('memoir_projects')
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    await qc.invalidateQueries({ queryKey: ['projects', user?.id] });
    setProject(data.id);
    return data as Project;
  };

  const project = useMemo(
    () => projects.find((p) => p.id === projectId) ?? null,
    [projects, projectId],
  );

  // For new entries: the selected project, or the default if in Everything mode.
  const activeProject = useMemo(
    () => project ?? projects.find((p) => p.is_default) ?? projects[0] ?? null,
    [project, projects],
  );

  const viewProjectId: string | null | undefined = isLoading
    ? undefined
    : isEverythingMode
      ? null
      : projectId;

  const mergedSettings = useMemo(
    () => effectiveSettings(settings, project?.settings_override),
    [settings, project?.settings_override],
  );

  const value: ProjectContextValue = {
    projects,
    project,
    activeProject,
    isEverything: isEverythingMode,
    viewProjectId,
    settings: mergedSettings,
    date,
    loading: isLoading,
    setProject,
    setDate,
    createProject,
    refetchProjects: () => void qc.invalidateQueries({ queryKey: ['projects', user?.id] }),
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useProject(): ProjectContextValue {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used within ProjectProvider');
  return ctx;
}
