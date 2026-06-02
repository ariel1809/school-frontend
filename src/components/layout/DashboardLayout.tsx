import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  KeyRound,
  FileClock,
  Building2,
  Calendar,
  GraduationCap,
  LogOut,
  Menu,
  UserPlus,
  School,
  BriefcaseBusiness,
  Wallet,
  Receipt,
  CreditCard,
  Coins,
  ChevronRight,
  Search,
  Bell,
} from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type NavItem = {
  to: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
};

type NavGroup = {
  labelKey: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    labelKey: 'nav.group.overview',
    items: [{ to: '/', labelKey: 'nav.dashboard', icon: LayoutDashboard }],
  },
  {
    labelKey: 'nav.group.pedagogy',
    items: [
      { to: '/students', labelKey: 'nav.students', icon: UserPlus, roles: ['SUPER_ADMIN', 'ADMIN', 'SECRETARY', 'PEDAGOGIC_MANAGER', 'TEACHER', 'CENSOR', 'SUPERVISOR', 'ACCOUNTANT'] },
      { to: '/teachers', labelKey: 'nav.teachers', icon: BriefcaseBusiness, roles: ['SUPER_ADMIN', 'ADMIN', 'PEDAGOGIC_MANAGER', 'SECRETARY', 'CENSOR', 'ACCOUNTANT'] },
      { to: '/classrooms', labelKey: 'nav.classrooms', icon: School, roles: ['SUPER_ADMIN', 'ADMIN', 'SECRETARY', 'PEDAGOGIC_MANAGER', 'TEACHER'] },
    ],
  },
  {
    labelKey: 'nav.group.finance',
    items: [
      { to: '/billing', labelKey: 'nav.financialDashboard', icon: Wallet, roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'] },
      { to: '/invoices', labelKey: 'nav.invoices', icon: Receipt, roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'SECRETARY'] },
      { to: '/payments', labelKey: 'nav.payments', icon: CreditCard, roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'SECRETARY'] },
      { to: '/fee-types', labelKey: 'nav.feeTypes', icon: Coins, roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'] },
    ],
  },
  {
    labelKey: 'nav.group.administration',
    items: [
      { to: '/users', labelKey: 'nav.users', icon: Users, roles: ['SUPER_ADMIN', 'ADMIN'] },
      { to: '/roles', labelKey: 'nav.roles', icon: ShieldCheck, roles: ['SUPER_ADMIN', 'ADMIN'] },
      { to: '/permissions', labelKey: 'nav.permissions', icon: KeyRound, roles: ['SUPER_ADMIN', 'ADMIN'] },
      { to: '/audit', labelKey: 'nav.audit', icon: FileClock, roles: ['SUPER_ADMIN'] },
    ],
  },
  {
    labelKey: 'nav.group.configuration',
    items: [
      { to: '/config/establishment', labelKey: 'nav.establishment', icon: Building2, roles: ['SUPER_ADMIN', 'ADMIN'] },
      { to: '/config/academic-years', labelKey: 'nav.academicYears', icon: Calendar, roles: ['SUPER_ADMIN', 'ADMIN', 'PEDAGOGIC_MANAGER'] },
      { to: '/config/curriculum', labelKey: 'nav.curriculum', icon: GraduationCap, roles: ['SUPER_ADMIN', 'ADMIN', 'PEDAGOGIC_MANAGER'] },
    ],
  },
];

// Map paths to their nav label for breadcrumb resolution
function getBreadcrumb(pathname: string, t: (k: string) => string): { group?: string; page?: string } {
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      const matches = item.to === '/' ? pathname === '/' : pathname === item.to || pathname.startsWith(item.to + '/');
      if (matches) {
        return { group: t(group.labelKey), page: t(item.labelKey) };
      }
    }
  }
  return {};
}

function getInitials(name?: string) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function DashboardLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, hasAnyRole } = useAuthStore();
  const [open, setOpen] = useState(false);

  const { data: establishment } = useQuery({
    queryKey: ['establishment'],
    queryFn: async () =>
      (await api.get('/v1/config/establishment')).data.data as {
        name: string;
        logoUrl?: string;
        configured: boolean;
      },
    staleTime: 60_000,
  });

  useEffect(() => {
    if (establishment && !establishment.configured) {
      navigate('/setup', { replace: true });
    }
  }, [establishment, navigate]);

  const visibleGroups = useMemo(
    () =>
      NAV_GROUPS.map((g) => ({
        ...g,
        items: g.items.filter((it) => !it.roles || hasAnyRole(...it.roles)),
      })).filter((g) => g.items.length > 0),
    [hasAnyRole]
  );

  const breadcrumb = getBreadcrumb(location.pathname, t);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Overlay (mobile) */}
      {open && (
        <button
          aria-label="Close sidebar"
          className="fixed inset-0 z-20 bg-foreground/30 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:sticky lg:top-0 inset-y-0 left-0 z-30 w-72 flex flex-col',
          'bg-card border-r border-border/70',
          'transition-transform duration-200 ease-out',
          'h-screen',
          open ? 'translate-x-0 shadow-elevated' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-border/70 shrink-0">
          {establishment?.logoUrl ? (
            <img
              src={establishment.logoUrl}
              alt=""
              className="h-9 w-9 rounded-md object-cover ring-1 ring-border"
            />
          ) : (
            <div className="h-9 w-9 rounded-md bg-primary text-primary-foreground flex items-center justify-center shadow-soft">
              <GraduationCap className="h-5 w-5" />
            </div>
          )}
          <Link to="/" className="min-w-0 flex flex-col">
            <span className="font-display font-semibold text-base leading-tight truncate text-foreground">
              {establishment?.name ?? t('app.name')}
            </span>
            <span className="text-[11px] text-muted-foreground truncate">{t('app.tagline')}</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto scroll-thin space-y-6">
          {visibleGroups.map((group) => (
            <div key={group.labelKey}>
              <div className="px-3 mb-2 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                {t(group.labelKey)}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'group relative flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-soft'
                          : 'text-foreground/75 hover:bg-muted hover:text-foreground'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon
                          className={cn(
                            'h-[18px] w-[18px] shrink-0',
                            isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'
                          )}
                        />
                        <span className="truncate">{t(item.labelKey)}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User card */}
        <div className="p-3 border-t border-border/70 shrink-0">
          <div className="flex items-center gap-3 p-2.5 rounded-md hover:bg-muted transition-colors">
            <div className="h-9 w-9 rounded-full bg-primary-soft text-primary flex items-center justify-center font-semibold text-sm shrink-0">
              {getInitials(user?.fullName)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate text-foreground">{user?.fullName}</div>
              <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
            </div>
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/login');
              }}
              title={t('auth.logout')}
              className="h-8 w-8 rounded-md inline-flex items-center justify-center text-muted-foreground hover:bg-destructive-soft hover:text-destructive transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-10 h-16 bg-card/80 backdrop-blur border-b border-border/70 flex items-center px-4 lg:px-8 gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden -ml-2"
            onClick={() => setOpen((o) => !o)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Breadcrumb */}
          <div className="hidden sm:flex items-center gap-1.5 text-sm min-w-0">
            {breadcrumb.group && (
              <>
                <span className="text-muted-foreground truncate">{breadcrumb.group}</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
              </>
            )}
            {breadcrumb.page && (
              <span className="font-medium text-foreground truncate">{breadcrumb.page}</span>
            )}
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md mx-auto hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder={t('common.searchPlaceholder')}
                className="pl-9 h-9 bg-muted/50 border-transparent focus-visible:bg-card focus-visible:border-input"
              />
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-sm" aria-label="Notifications">
              <Bell className="h-[18px] w-[18px]" />
            </Button>
            <div className="hidden md:flex items-center gap-2 ml-2 pl-3 border-l border-border/70">
              <div className="text-right">
                <div className="text-xs font-medium text-foreground">{user?.fullName}</div>
                <div className="text-[11px] text-muted-foreground truncate max-w-[160px]">
                  {user?.roles.join(' · ')}
                </div>
              </div>
              <div className="h-8 w-8 rounded-full bg-primary-soft text-primary flex items-center justify-center font-semibold text-xs">
                {getInitials(user?.fullName)}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 px-4 py-6 lg:px-8 lg:py-8 max-w-[1600px] w-full mx-auto animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
