import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { projectService } from '@/services/projectService';
import { subscriptionService } from '@/services/subscriptionService';
import { authService } from '@/services/authService';
import { Project, Subscription } from '@/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDate } from '@/lib/utils';
import { useNotifications } from '@/context/NotificationContext';
import {
  Users, Search, ArrowRight, CheckCircle, AlertTriangle, Clock, Layers, Lock, LockOpen, ShieldAlert
} from 'lucide-react';
import { PageTransition } from '@/components/layout/PageTransition';

interface ClientSummary {
  email: string;
  name: string;
  orderCount: number;
  latestOrderStatus: string;
  latestOrderDate: string;
  subscription: Subscription | null;
  isLocked: boolean;
}

export const AdminClientsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [lockStatuses, setLockStatuses] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [unlockingEmail, setUnlockingEmail] = useState<string | null>(null);
  const { addToast } = useNotifications();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [projData, subData] = await Promise.all([
        projectService.getProjects(),
        subscriptionService.getSubscriptions()
      ]);
      setProjects(projData);
      setSubscriptions(subData);

      // Fetch lock statuses for all unique client emails
      const emails = Array.from(
        new Set(projData.map((p: Project) => p.clientEmail.toLowerCase()))
      );
      const statuses = await Promise.all(
        emails.map(async (email) => {
          try {
            const s = await authService.getLockStatus(email);
            return [email, s.isLocked] as [string, boolean];
          } catch {
            return [email, false] as [string, boolean];
          }
        })
      );
      setLockStatuses(Object.fromEntries(statuses));
    } catch (err) {
      console.error('Failed to load clients data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUnlock = async (email: string) => {
    setUnlockingEmail(email);
    try {
      await authService.unlockClient(email);
      setLockStatuses(prev => ({ ...prev, [email]: false }));
      addToast({
        type: 'success',
        title: 'Account Unlocked',
        description: `${email} can now log in again.`
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Unlock Failed',
        description: err instanceof Error ? err.message : 'Could not unlock account.'
      });
    } finally {
      setUnlockingEmail(null);
    }
  };

  // Aggregate by email
  const clients = useMemo<ClientSummary[]>(() => {
    const emailMap = new Map<string, Project[]>();
    for (const p of projects) {
      const key = p.clientEmail.toLowerCase();
      if (!emailMap.has(key)) emailMap.set(key, []);
      emailMap.get(key)!.push(p);
    }

    return Array.from(emailMap.entries())
      .map(([email, clientProjects]) => {
        const sorted = [...clientProjects].sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        const latest = sorted[0];
        const sub = subscriptions.find(s => s.clientEmail.toLowerCase() === email) ?? null;

        return {
          email,
          name: latest.clientName,
          orderCount: clientProjects.length,
          latestOrderStatus: latest.status,
          latestOrderDate: latest.updatedAt,
          subscription: sub,
          isLocked: lockStatuses[email] ?? false
        };
      })
      .sort((a, b) => {
        // Locked accounts float to top
        if (a.isLocked && !b.isLocked) return -1;
        if (!a.isLocked && b.isLocked) return 1;
        return b.orderCount - a.orderCount;
      });
  }, [projects, subscriptions, lockStatuses]);

  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;
    const q = searchQuery.toLowerCase();
    return clients.filter(
      c => c.email.includes(q) || c.name.toLowerCase().includes(q)
    );
  }, [clients, searchQuery]);

  const lockedCount = clients.filter(c => c.isLocked).length;

  const getSubBadge = (sub: Subscription | null) => {
    if (!sub) return <span className="text-[var(--ink-soft)] text-xs">No subscription</span>;
    if (sub.status === 'active')
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
          <CheckCircle className="w-3 h-3" />
          Active · {sub.plan}
        </span>
      );
    if (sub.status === 'renewal_requested')
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium inline-flex items-center gap-1 bg-amber-500/15 text-amber-500 border border-amber-500/30">
          <Clock className="w-3 h-3" />
          Renewal Requested
        </span>
      );
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium inline-flex items-center gap-1 bg-red-500/15 text-red-500 border border-red-500/30">
        <AlertTriangle className="w-3 h-3" />
        Expired
      </span>
    );
  };

  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--contrast)] pb-6">
          <div>
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-purple-500">
              Client Accounts
            </span>
            <h1 className="font-heading text-3xl font-extrabold text-[var(--ink)] mt-1">
              All Clients
            </h1>
            <p className="text-sm text-[var(--ink-soft)] mt-1">
              All unique client accounts derived from order data. Click a client to see all their orders.
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm text-[var(--ink-soft)]">
            {lockedCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-mono font-bold">
                <ShieldAlert className="w-3.5 h-3.5" />
                {lockedCount} locked
              </span>
            )}
            <span className="inline-flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span className="font-mono font-semibold text-[var(--ink)]">{clients.length}</span>
              unique client{clients.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search by email or company name..."
            leftIcon={<Search className="w-4 h-4" />}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Clients Table */}
        <Card glass>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4].map(n => <Skeleton key={n} className="h-14 w-full" />)}
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="p-12 text-center text-[var(--ink-soft)]">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <h3 className="text-base font-semibold font-heading text-[var(--ink)]">No Clients Found</h3>
                <p className="text-xs mt-1">Try adjusting your search query.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--surface-soft)] border-b border-[var(--contrast)] text-[var(--ink-soft)] font-mono uppercase">
                    <tr>
                      <th className="px-6 py-3.5">Client</th>
                      <th className="px-6 py-3.5">Email</th>
                      <th className="px-6 py-3.5 text-center">Orders</th>
                      <th className="px-6 py-3.5">Latest Status</th>
                      <th className="px-6 py-3.5">Subscription</th>
                      <th className="px-6 py-3.5">Account</th>
                      <th className="px-6 py-3.5">Last Activity</th>
                      <th className="px-6 py-3.5 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--contrast)]">
                    {filteredClients.map(client => (
                      <tr
                        key={client.email}
                        className={`hover:bg-[var(--surface-soft)] transition-colors group ${client.isLocked ? 'bg-red-500/5' : ''}`}
                      >
                        <td className="px-6 py-4 font-bold text-[var(--ink)] font-heading">
                          <Link
                            to={`/admin/clients/${encodeURIComponent(client.email)}`}
                            className="hover:text-[#2D5BFF] transition-colors"
                          >
                            {client.name}
                          </Link>
                        </td>
                        <td className="px-6 py-4 font-mono text-[var(--ink-soft)]">
                          <Link
                            to={`/admin/clients/${encodeURIComponent(client.email)}`}
                            className="hover:text-[#2D5BFF] transition-colors"
                          >
                            {client.email}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center gap-1 font-mono font-bold text-[var(--ink)]">
                            <Layers className="w-3.5 h-3.5 text-[#2D5BFF]" />
                            {client.orderCount}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Badge status={client.latestOrderStatus as Parameters<typeof Badge>[0]['status']} size="sm" />
                        </td>
                        <td className="px-6 py-4">
                          {getSubBadge(client.subscription)}
                        </td>
                        <td className="px-6 py-4">
                          {client.isLocked ? (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-500/15 text-red-500 border border-red-500/30">
                                <Lock className="w-2.5 h-2.5" /> Locked
                              </span>
                              <button
                                onClick={() => handleUnlock(client.email)}
                                disabled={unlockingEmail === client.email}
                                title="Unlock account"
                                className="flex items-center gap-1 text-[10px] font-semibold text-emerald-500 hover:text-emerald-400 transition-colors disabled:opacity-50"
                              >
                                <LockOpen className="w-3 h-3" />
                                {unlockingEmail === client.email ? 'Unlocking…' : 'Unlock'}
                              </button>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                              <CheckCircle className="w-2.5 h-2.5" /> Active
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-[var(--ink-soft)]">
                          {formatDate(client.latestOrderDate)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            to={`/admin/clients/${encodeURIComponent(client.email)}`}
                            className="inline-flex items-center gap-1 text-[#2D5BFF] font-semibold hover:underline group-hover:translate-x-0.5 transition-transform"
                          >
                            View All Orders
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
};
