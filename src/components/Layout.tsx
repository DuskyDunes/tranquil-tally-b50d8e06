
import { useAuth } from '../contexts/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';
import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Home, DollarSign, Calendar, Users, Settings, LogOut, Receipt } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return <Navigate to="/login" />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: DollarSign, label: 'New Sale', path: '/new-sale' },
    { icon: Receipt, label: 'Transactions', path: '/transactions' },
    { icon: Calendar, label: 'Services', path: '/services' },
    { icon: Users, label: 'Staff', path: '/staff' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-secondary">
        <Sidebar className="hidden md:block">
          <SidebarContent>
            <SidebarGroup>
              <div className="px-4 py-6">
                <h1 className="text-xl md:text-2xl font-semibold text-primary truncate">De Style Mens Saloon</h1>
              </div>
              <SidebarGroupContent>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      onClick={() => navigate(item.path)}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-accent rounded-lg transition-all duration-300 w-full"
                    >
                      <item.icon className="w-5 h-5 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-all duration-300 w-full"
                  >
                    <LogOut className="w-5 h-5 shrink-0" />
                    <span>Logout</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        {/* Mobile Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t md:hidden z-50">
          <div className="flex justify-around items-center p-3">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center gap-1"
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
