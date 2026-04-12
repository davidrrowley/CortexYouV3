import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Header,
  HeaderName,
  HeaderGlobalBar,
  HeaderGlobalAction,
  SkipToContent,
  SideNav,
  SideNavItems,
  SideNavLink,
  Content,
} from '@carbon/react';
import {
  Add,
  Home,
  Camera,
  Search,
  Network_3,
  Idea,
  Settings,
  Menu,
} from '@carbon/icons-react';
import { useAppStore } from '../store/useAppStore';
import QuickCapture from './QuickCapture';

interface ShellProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', Icon: Home },
  { label: 'Browse', path: '/browse', Icon: Search },
  { label: 'Capture', path: '/capture', Icon: Camera },
  { label: 'Concepts', path: '/concepts', Icon: Idea },
  { label: 'Graph', path: '/graph', Icon: Network_3 },
  { label: 'Settings', path: '/settings', Icon: Settings },
];

export default function Shell({ children }: ShellProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sideNavOpen, setSideNavOpen] = useState(false);
  const { captureOpen, openCapture, closeCapture } = useAppStore();

  return (
    <>
      <SkipToContent href="#main-content" />
      <Header aria-label="CortexYou">
        <HeaderGlobalAction
          aria-label="Toggle navigation"
          onClick={() => setSideNavOpen((o) => !o)}
          tooltipAlignment="end"
        >
          <Menu size={20} />
        </HeaderGlobalAction>
        <HeaderName prefix="" onClick={() => navigate('/dashboard')}>
          CortexYou
        </HeaderName>
        <HeaderGlobalBar>
          <HeaderGlobalAction
            aria-label="Quick capture"
            tooltipAlignment="end"
            onClick={openCapture}
          >
            <Add size={20} />
          </HeaderGlobalAction>
        </HeaderGlobalBar>
      </Header>

      <SideNav
        aria-label="Side navigation"
        expanded={sideNavOpen}
        onOverlayClick={() => setSideNavOpen(false)}
        isPersistent={false}
      >
        <SideNavItems>
          {NAV_ITEMS.map(({ label, path, Icon }) => (
            <SideNavLink
              key={path}
              renderIcon={Icon}
              href={path}
              isActive={location.pathname.startsWith(path)}
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                navigate(path);
                setSideNavOpen(false);
              }}
            >
              {label}
            </SideNavLink>
          ))}
        </SideNavItems>
      </SideNav>

      <Content id="main-content" style={{ paddingTop: '3rem' }}>
        {children}
      </Content>

      {captureOpen && <QuickCapture onClose={closeCapture} />}
    </>
  );
}
