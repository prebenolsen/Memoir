import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthProvider';
import { useSettings } from './SettingsProvider';
import { effectiveSettings, newId, todayISO } from '@/lib/format';
import type { Project, Settings } from '@/types/db';

interface ProjectContextValue {
  projects: Project[];
  project: Project | null;
  /** Settings with the active project's override applied. */
  settings: Settings;
  date: string; // active experience date (YYYY-MM-DD)
  loading: boolean;
  setProject: (id: string) => void;
  setDate: (iso: string) => void;
  createProject: (input: {
    name: string;
    start_date?: string | null;
    end_date?: string | null;
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
  const [date, setDateState] = useState<string>(todayISO());

  // Initialise selection once projects + settings are known.
  useEffect(() => {
    if (!projects.length) return;
    if (projectId && projects.some((p) => p.id === projectId)) return;
    const remembered =
      settings.remember_last_project && settings.last_project_id
        ? projects.find((p) => p.id === settings.last_project_id)
        : undefined;
    const fallback = projects.find((p) => p.is_default) ?? projects[0];
    setProjectId((remembered ?? fallback).id);
  }, [projects, projectId, settings.remember_last_project, settings.last_project_id]);

  // Restore last date once on load if the user opted in.
  useEffect(() => {
    if (settings.remember_last_date && settings.last_date) {
      setDateState(settings.last_date);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.remember_last_date]);

  const setProject = (id: string) => {
    setProjectId(id);
    if (settings.remember_last_project) void updateSettings({ last_project_id: id });
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

  const mergedSettings = useMemo(
    () => effectiveSettings(settings, project?.settings_override),
    [settings, project?.settings_override],
  );

  const value: ProjectContextValue = {
    projects,
    project,
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
