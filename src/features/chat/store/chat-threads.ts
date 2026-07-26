import { create } from 'zustand';

export type ChatThreadItem = {
  /** `main` or short thread id */
  id: string;
  employeeId: string;
  title: string;
  preview: string;
  updatedAt: string;
};

type ChatThreadsState = {
  threads: ChatThreadItem[];
  touch: (input: {
    id: string;
    employeeId: string;
    title?: string;
    preview?: string;
  }) => void;
  remove: (employeeId: string, threadId: string) => void;
  forEmployee: (employeeId: string) => ChatThreadItem[];
};

function sortNewest(items: ChatThreadItem[]) {
  return [...items].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export const useChatThreadsStore = create<ChatThreadsState>((set, get) => ({
  threads: [],

  touch: ({ id, employeeId, title, preview }) => {
    const now = new Date().toISOString();
    set((state) => {
      const existing = state.threads.find(
        (item) => item.employeeId === employeeId && item.id === id,
      );
      const next: ChatThreadItem = {
        id,
        employeeId,
        title:
          title?.trim() ||
          existing?.title ||
          (id === 'main' ? 'Main chat' : 'New chat'),
        preview: preview?.trim() || existing?.preview || 'No messages yet',
        updatedAt: now,
      };
      const rest = state.threads.filter(
        (item) => !(item.employeeId === employeeId && item.id === id),
      );
      return { threads: sortNewest([next, ...rest]).slice(0, 40) };
    });
  },

  remove: (employeeId, threadId) => {
    set((state) => ({
      threads: state.threads.filter(
        (item) => !(item.employeeId === employeeId && item.id === threadId),
      ),
    }));
  },

  forEmployee: (employeeId) =>
    sortNewest(get().threads.filter((item) => item.employeeId === employeeId)),
}));

export function createThreadId() {
  return `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
