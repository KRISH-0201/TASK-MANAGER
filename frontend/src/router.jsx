import React, { createContext, useContext, useState, useEffect, useTransition } from 'react';

const RouterContext = createContext({
  pathname: window.location.pathname || '/',
  navigate: () => {},
});

export const BrowserRouter = ({ children }) => {
  const [pathname, setPathname] = useState(window.location.pathname || '/');

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (to) => {
    if (window.location.pathname !== to) {
      window.history.pushState({}, '', to);
      setPathname(to);
    }
  };

  return (
    <RouterContext.Provider value={{ pathname, navigate }}>
      {children}
    </RouterContext.Provider>
  );
};

export const useLocation = () => {
  const { pathname } = useContext(RouterContext);
  return { pathname };
};

export const useNavigate = () => {
  const { navigate } = useContext(RouterContext);
  return navigate;
};

export const Routes = ({ children }) => {
  const { pathname } = useContext(RouterContext);
  let matchedElement = null;

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    const { path, element } = child.props;
    
    // Match exact path or wildcard
    if (path === pathname || (path === '/' && pathname === '') || path === '*') {
      if (!matchedElement) {
        matchedElement = element;
      }
    }
  });

  return matchedElement || null;
};

export const Route = ({ path, element }) => {
  return element;
};

export const Link = ({ to, children, className, style, ...rest }) => {
  const navigate = useNavigate();

  const handleClick = (e) => {
    e.preventDefault();
    navigate(to);
  };

  return (
    <a href={to} onClick={handleClick} className={className} style={style} {...rest}>
      {children}
    </a>
  );
};

export const NavLink = ({ to, children, className = '', activeClassName = 'active', ...rest }) => {
  const { pathname } = useLocation();
  const isActive = pathname === to;
  const combinedClass = `${className} ${isActive ? activeClassName : ''}`.trim();

  return (
    <Link to={to} className={combinedClass} {...rest}>
      {children}
    </Link>
  );
};

export default {
  BrowserRouter,
  Routes,
  Route,
  Link,
  NavLink,
  useLocation,
  useNavigate,
};
