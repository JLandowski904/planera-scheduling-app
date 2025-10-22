import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';

interface RouterContextValue {
  path: string;
  navigate: (to: string, options?: { replace?: boolean }) => void;
}

const RouterContext = createContext<RouterContextValue | null>(null);
const ParamsContext = createContext<Record<string, string>>({});

const getCurrentPath = () =>
  window.location.pathname + window.location.search + window.location.hash;

const normalizePathname = (path: string) => {
  if (!path) return '/';
  try {
    const url = new URL(path, window.location.origin);
    return url.pathname.replace(/\/+$/, '') || '/';
  } catch {
    return path.replace(/\/+$/, '') || '/';
  }
};

const splitPath = (path: string) =>
  normalizePathname(path)
    .split('/')
    .filter(Boolean);

const matchPath = (pattern: string, pathname: string) => {
  if (pattern === '*') {
    return { matched: true, params: {} as Record<string, string> };
  }

  const patternParts = splitPath(pattern);
  const pathParts = splitPath(pathname);

  if (patternParts.length !== pathParts.length) {
    return { matched: false, params: {} as Record<string, string> };
  }

  const params: Record<string, string> = {};

  for (let i = 0; i < patternParts.length; i += 1) {
    const patternPart = patternParts[i];
    const pathPart = pathParts[i];

    if (patternPart.startsWith(':')) {
      const paramName = patternPart.slice(1);
      params[paramName] = decodeURIComponent(pathPart);
    } else if (patternPart !== pathPart) {
      return { matched: false, params: {} as Record<string, string> };
    }
  }

  return { matched: true, params };
};

interface BrowserRouterProps {
  children: ReactNode;
}

export const BrowserRouter: React.FC<BrowserRouterProps> = ({ children }) => {
  const [path, setPath] = useState(() => getCurrentPath());

  useEffect(() => {
    const handlePopState = () => {
      setPath(getCurrentPath());
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback((to: string, options?: { replace?: boolean }) => {
    if (options?.replace) {
      window.history.replaceState(null, '', to);
    } else {
      window.history.pushState(null, '', to);
    }
    setPath(getCurrentPath());
  }, []);

  const value = useMemo(
    () => ({
      path: normalizePathname(path),
      navigate,
    }),
    [path, navigate]
  );

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
};

interface RoutesProps {
  children: ReactNode;
}

export const Routes: React.FC<RoutesProps> = ({ children }) => {
  const router = useContext(RouterContext);

  if (!router) {
    throw new Error('Routes must be rendered within a BrowserRouter');
  }

  let element: ReactNode = null;
  let params: Record<string, string> = {};

  React.Children.forEach(children, (child) => {
    if (element || !React.isValidElement(child)) {
      return;
    }

    const routePath = child.props.path ?? child.props.pathname;
    if (typeof routePath !== 'string') {
      return;
    }

    const match = matchPath(routePath, router.path);
    if (match.matched && element === null) {
      element = child.props.element ?? child.props.children ?? null;
      params = match.params;
    }
  });

  return (
    <ParamsContext.Provider value={params}>
      {element !== null ? <>{element}</> : null}
    </ParamsContext.Provider>
  );
};

interface RouteProps {
  path: string;
  element?: ReactNode;
  children?: ReactNode;
}

export const Route: React.FC<RouteProps> = () => null;

interface NavigateProps {
  to: string;
  replace?: boolean;
}

export const Navigate: React.FC<NavigateProps> = ({ to, replace }) => {
  const router = useContext(RouterContext);

  if (!router) {
    throw new Error('Navigate must be rendered within a BrowserRouter');
  }

  useEffect(() => {
    router.navigate(to, { replace });
  }, [router, to, replace]);

  return null;
};

export const useNavigate = () => {
  const router = useContext(RouterContext);

  if (!router) {
    throw new Error('useNavigate must be used within a BrowserRouter');
  }

  return router.navigate;
};

export const useParams = <T extends Record<string, string> = Record<string, string>>() => {
  const params = useContext(ParamsContext);
  return params as T;
};
