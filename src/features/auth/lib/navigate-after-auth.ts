import type { Href } from 'expo-router';

type NavigateArgs = {
  session?: { currentTask?: unknown } | null;
  decorateUrl: (path: string) => string;
};

export function createAuthNavigate(routerReplace: (href: Href) => void) {
  return ({ session, decorateUrl }: NavigateArgs) => {
    if (session?.currentTask) {
      return;
    }

    const url = decorateUrl('/');
    if (url.startsWith('http')) {
      // Web absolute redirects from Clerk decorateUrl
      if (typeof window !== 'undefined') {
        window.location.href = url;
      }
      return;
    }

    routerReplace(url as Href);
  };
}
