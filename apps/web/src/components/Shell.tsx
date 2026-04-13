import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Header,
  HeaderMenuButton,
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
        <HeaderMenuButton
          aria-label={sideNavOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setSideNavOpen((o) => !o)}
          isActive={sideNavOpen}
        />
        <HeaderName {...({ element: Link, to: '/dashboard', prefix: '' } as any)}>
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
        isRail={false}
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

      <Content id="main-content">
        {children}
      </Content>

      {captureOpen && <QuickCapture onClose={closeCapture} />}
    </>
  );
}
