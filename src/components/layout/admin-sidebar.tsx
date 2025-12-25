'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Wrench, 
  BarChart3, 
  FileText, 
  Activity,
  Settings,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';

const adminItems = [
  { name: 'Overview', href: '/admin', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'AI Tools', href: '/admin/tools', icon: Wrench },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Logs', href: '/admin/logs', icon: FileText },
  { name: 'System Health', href: '/admin/health', icon: Activity },
  { name: 'Messages', href: '/admin/messages', icon: MessageSquare },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r bg-background">
      <div className="flex h-full flex-col">
        {/* Admin Badge */}
        <div className="border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-sm font-semibold">Admin Panel</span>
          </div>
        </div>

        {/* Sidebar Content */}
        <nav className="flex-1 space-y-1 px-2 py-4">
          {adminItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Back to Dashboard */}
        <div className="border-t p-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </aside>
  );
}
