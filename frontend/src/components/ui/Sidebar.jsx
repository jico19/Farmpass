import {
    LayoutDashboard,
    FilePlus2,
    History,
    Map,
    UserCog,
    Settings,
    QrCode,
    BarChart3,
    Bell,
    CreditCard,
    LogOut,
    Menu,
    FilesIcon,
    FileText,
    Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import useAuthStore from "../../store/authStore";
import { Link, useNavigate, useLocation } from "react-router-dom";
import MobileNavbar from "./MobileNavbar";
import { useGetSectionNotificationCounts, useMarkSectionRead } from "../../hooks/useNotifications";
import NotificationBadge from "./NotificationBadge";
import AnimatedSheet from '../motion/AnimatedSheet';

// Standard navigation item for the sidebar.
// Follows Design.MD: stone text, green active indicator on the right.
const SidebarItem = ({ icon: Icon, label, to, badgeCount = 0 }) => {
    const location = useLocation();
    const normalize = (path) => path.replace(/\/+$/, '') || '/';
    const isActive = normalize(location.pathname) === normalize(to);

    return (
        <li>
            <Link
                to={to}
                aria-current={isActive ? "page" : undefined}
                className={`ui-nav-link flex items-center gap-3 px-6 py-2.5 transition-[color,background-color,border-color] duration-150 ease-smooth motion-reduce:transition-none relative ${isActive
                    ? "bg-green-50 text-green-700 border-r-2 border-green-700"
                    : "text-stone-600 border-r-2 border-transparent hover-only:hover:bg-stone-50 hover-only:hover:text-stone-900"
                    }`}
            >
                <div className="relative">
                    <Icon size={20} className={isActive ? "text-green-700" : "text-stone-400"} />
                    {badgeCount > 0 && <NotificationBadge count={badgeCount} dotOnly={true} />}
                </div>
                <span className={`text-sm tracking-tight ${isActive ? "font-bold" : "font-medium"}`}>{label}</span>
                {badgeCount > 0 && (
                    <span className="ml-auto text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-red-50 text-red-600 border border-red-200">
                        {badgeCount > 99 ? '99+' : badgeCount}
                    </span>
                )}
            </Link>
        </li>
    );
};

// Section grouping for sidebar navigation items by functional domain.
// Uses text-[10px] font-black uppercase tracking-widest per Design.MD.
const MenuSection = ({ title, children, isFirst = false }) => (
    <div className={isFirst ? "mt-1 mb-2" : "mt-6 mb-2"}>
        <div className="px-6 mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">
                {title}
            </span>
        </div>
        <ul className="flex flex-col">
            {children}
        </ul>
    </div>
);

// Navigation grouped by role, purpose, and workflow relevance
const NAVIGATION_CONFIG = {
    Farmer: [
        {
            title: "Overview",
            items: [
                { icon: LayoutDashboard, label: "Dashboard", to: "/farmer/" },
            ],
        },
        {
            title: "Permit Services",
            items: [
                { icon: FilePlus2, label: "Apply for Permit", to: "/farmer/application/create/" },
                { icon: FilesIcon, label: "My Documents", to: "/farmer/documents/" },
                { icon: FilesIcon, label: "My Applications", to: "/farmer/application", badgeKey: "applications" },
            ],
        },
        {
            title: "Account",
            items: [
                { icon: Bell, label: "Your Messages", to: "/farmer/notification/" },
                { icon: Settings, label: "Your Settings", to: "/farmer/settings/", badgeKey: "farmers" },
            ],
        },
    ],
    Agri: [
        {
            title: "Operations",
            items: [
                { icon: LayoutDashboard, label: "Overview", to: "/agri/" },
                { icon: FilesIcon, label: "Applications", to: "/agri/application", badgeKey: "applications" },
                { icon: CreditCard, label: "Payments", to: "/agri/payment", badgeKey: "payments" },
            ],
        },
        {
            title: "Field & Registries",
            items: [
                { icon: Users, label: "Farmers", to: "/agri/farmers/", badgeKey: "farmers" },
                { icon: Users, label: "Barangay Officials", to: "/agri/barangay-officials/" },
                { icon: Map, label: "Pig Density Map", to: "/agri/map/pig-density/" },
            ],
        },
        {
            title: "Intelligence & Audit",
            items: [
                { icon: BarChart3, label: "Reports", to: "/agri/reports/" },
                { icon: History, label: "Audit Trail", to: "/agri/audit-trail/" },
            ],
        },
        {
            title: "System & Account",
            items: [
                { icon: Bell, label: "Notifications", to: "/agri/notification/" },
                { icon: Settings, label: "Settings", to: "/agri/settings/" },
            ],
        },
    ],
    Barangay: [
        {
            title: "Overview",
            items: [
                { icon: LayoutDashboard, label: "Dashboard", to: "/barangay" },
            ],
        },
        {
            title: "Field Operations",
            items: [
                { icon: FileText, label: "Hog Surveys", to: "/barangay/hog-surveys/", badgeKey: "surveys" },
                { icon: FileText, label: "CIS Generator", to: "/barangay/cis-generator/" },
            ],
        },
        {
            title: "Records & Account",
            items: [
                { icon: History, label: "Audit Logs", to: "/barangay/audit-logs/" },
                { icon: Bell, label: "Notifications", to: "/barangay/notification/" },
                { icon: Settings, label: "Settings", to: "/barangay/settings/" },
            ],
        },
    ],
    Opv: [
        {
            title: "Permit Operations",
            items: [
                { icon: LayoutDashboard, label: "Overview", to: "/opv/" },
                { icon: FilesIcon, label: "Applications", to: "/opv/application/", badgeKey: "applications" },
            ],
        },
        {
            title: "Account",
            items: [
                { icon: Bell, label: "Notifications", to: "/opv/notification/" },
                { icon: Settings, label: "Settings", to: "/opv/settings/" },
            ],
        },
    ],
    Inspector: [
        {
            title: "Field Inspection",
            items: [
                { icon: LayoutDashboard, label: "Dashboard", to: "/inspector/" },
                { icon: QrCode, label: "Scan QR Code", to: "/inspector/scan/" },
                { icon: History, label: "Inspection History", to: "/inspector/history/" },
            ],
        },
        {
            title: "Account",
            items: [
                { icon: Bell, label: "Notifications", to: "/inspector/notification/" },
                { icon: Settings, label: "Settings", to: "/inspector/settings/" },
            ],
        },
    ],
    Admin: [
        {
            title: "Administration",
            items: [
                { icon: UserCog, label: "Manage Users", to: "/admin/users" },
                { icon: Map, label: "Map Data", to: "/admin/map" },
                { icon: Settings, label: "System Tools", to: "/admin/settings" },
            ],
        },
    ],
};

const Sidebar = ({ children }) => {
    const { user, isAuthenticated, logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const triggerRef = useRef(null);

    useEffect(() => {
        if (!drawerOpen) return;
        const desktop = window.matchMedia('(min-width: 1024px)');
        const onResize = () => { if (desktop.matches) setDrawerOpen(false); };
        desktop.addEventListener('change', onResize);
        return () => {
            desktop.removeEventListener('change', onResize);
        };
    }, [drawerOpen]);

    const isMobileFirstRole = user && (user.role === 'Farmer' || user.role === 'Inspector' || user.role === 'Barangay');

    // Fetch unread notification counts per section for sidebar badges
    const { data: sectionCounts = {} } = useGetSectionNotificationCounts();
    const { mutate: markSectionRead } = useMarkSectionRead();

    // Auto-clear unread notification indicator when visiting the respective section
    useEffect(() => {
        const path = location.pathname;
        if (path.includes('/application') && sectionCounts.applications > 0) {
            markSectionRead('applications');
        } else if (path.includes('/payment') && sectionCounts.payments > 0) {
            markSectionRead('payments');
        } else if ((path.includes('/farmers') || path.includes('/settings')) && sectionCounts.farmers > 0) {
            markSectionRead('farmers');
        } else if (path.includes('/hog-surveys') && sectionCounts.surveys > 0) {
            markSectionRead('surveys');
        }
    }, [location.pathname, sectionCounts, markSectionRead]);

    const renderNavigation = () => {
        if (!isAuthenticated) {
            return (
                <div className="mt-2">
                    <ul className="flex flex-col">
                        <SidebarItem icon={LayoutDashboard} label="Public Info" to="/" />
                    </ul>
                </div>
            );
        }

        const sections = NAVIGATION_CONFIG[user?.role];
        if (!sections) {
            return (
                <div className="mt-2">
                    <ul className="flex flex-col">
                        <SidebarItem icon={LayoutDashboard} label="Home" to="/" />
                    </ul>
                </div>
            );
        }

        return sections.map((sec, idx) => (
            <MenuSection key={sec.title} title={sec.title} isFirst={idx === 0}>
                {sec.items.map((item) => (
                    <SidebarItem
                        key={item.to}
                        icon={item.icon}
                        label={item.label}
                        to={item.to}
                        badgeCount={item.badgeKey ? (sectionCounts[item.badgeKey] || 0) : 0}
                    />
                ))}
            </MenuSection>
        ));
    };

    const navigationPanel = (
        <div className="flex h-full min-h-screen w-64 flex-col bg-white border-r border-stone-200">
            <div className="px-6 pt-8 pb-5 border-b border-stone-100">
                <h1 className="text-xl font-black text-stone-900 flex items-center gap-1 leading-none tracking-tighter">
                    Farm<span className="text-green-700">Pass</span>
                </h1>
                <p className="text-[11px] font-black text-stone-400 mt-1.5 tracking-widest uppercase">Municipal Service Portal</p>
                {user?.role && <div className="mt-3 flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md bg-stone-100 text-stone-700 border border-stone-200">{user.role}</span>
                    {user.barangay_name && <span className="text-[11px] text-stone-500 font-medium truncate" title={`Brgy. ${user.barangay_name}`}>Brgy. {user.barangay_name}</span>}
                </div>}
            </div>
            <nav className="flex-1 overflow-y-auto py-2" onClick={event => {
                if (event.target.closest('a')) setDrawerOpen(false);
            }}>{renderNavigation()}</nav>
            <div className="p-4 border-t border-stone-100">
                <button onClick={async () => { await logout(); navigate('/'); }}
                    className="flex items-center w-full gap-3 px-4 py-3 text-xs font-black tracking-widest transition-colors rounded-lg text-stone-500 hover:bg-red-50 hover:text-red-600 uppercase">
                    <LogOut size={16} /> Sign Out
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-stone-50 font-sans lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">

            {/* Main Content Area */}
            <div className="flex min-w-0 flex-col bg-white lg:col-start-2 lg:row-start-1" inert={drawerOpen || undefined}>
                {/* Mobile Header - Hidden for mobile-first roles */}
                {!isMobileFirstRole && (
                    <header className="navbar lg:hidden bg-white border-b border-stone-100 px-4">
                        <button type="button" ref={triggerRef} onClick={() => setDrawerOpen(true)} aria-label="Open navigation" aria-expanded={drawerOpen} aria-controls="portal-navigation" className="btn btn-ghost btn-square text-stone-900 rounded-none">
                            <Menu size={24} />
                        </button>
                        <div className="flex-1 ml-2 font-black text-green-700 tracking-tighter text-xl">
                            FarmPass
                        </div>
                    </header>
                )}

                {/* Simplified Mobile Header for mobile-first roles (Branding + Notifications + Logout) */}
                {isMobileFirstRole && (
                    <header className="navbar lg:hidden bg-white border-b border-stone-100 px-6">
                        <div className="flex-1 font-black text-green-700 tracking-tighter text-xl">
                            FarmPass
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Notification Bell */}
                            <Link
                                to={`/${user.role.toLowerCase()}/notification/`}
                                className={`relative p-2 transition-colors ${location.pathname.includes('/notification/') ? 'text-green-700' : 'text-stone-400'
                                    }`}
                            >
                                <Bell size={20} />
                            </Link>

                            <button
                                onClick={async () => {
                                    await logout()
                                    navigate('/')
                                }}
                                className="flex items-center gap-2 text-stone-400 hover:text-red-600 transition-colors"
                                title="Log Out"
                            >
                                <span className="text-[10px] font-black uppercase tracking-widest">Log Out</span>
                                <LogOut size={18} />
                            </button>
                        </div>
                    </header>
                )}

                <main className={`flex-1 overflow-auto ${isMobileFirstRole ? 'pb-20 lg:pb-0' : ''}`}>
                    {children}
                </main>

                {/* Mobile-first bottom navbar */}
                {isMobileFirstRole && <MobileNavbar />}
            </div>

            <aside aria-label="Portal navigation" className="hidden lg:sticky lg:top-0 lg:col-start-1 lg:row-start-1 lg:block lg:h-screen lg:overflow-y-auto">
                {navigationPanel}
            </aside>
            <AnimatedSheet open={drawerOpen} side="left" onDismiss={() => setDrawerOpen(false)}>
                <div id="portal-navigation" aria-label="Portal navigation" className="fixed inset-0 z-[2000] flex bg-stone-900/40"
                    onClick={event => { if (event.target === event.currentTarget) setDrawerOpen(false); }}>
                    {navigationPanel}
                </div>
            </AnimatedSheet>
        </div>
    );
};

export default Sidebar;
