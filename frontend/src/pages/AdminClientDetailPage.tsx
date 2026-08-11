import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { projectService } from '@/services/projectService';
import { subscriptionService } from '@/services/subscriptionService';
import { authService } from '@/services/authService';
import { Project, Subscription } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDate, calculateDaysRemaining } from '@/lib/utils';
import { useNotifications } from '@/context/NotificationContext';
import {
  ArrowLeft,
  ExternalLink,
  Calendar,
  Layers,
  CheckCircle,
  AlertTriangle,
  Clock,
  User,
  Lock,
  LockOpen,
  ShieldAlert
} from 'lucide-react';
import { PageTransition } from '@/components/layout/PageTransition';

export const AdminClientDetailPage: React.FC = () => {
  const { email } = useParams<{ email: string }>();
  const decodedEmail = email ? decodeURIComponent(email) : '';
  const { addToast } = useNotifications();

  const [projects, setProjects] = useState<Project[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isUnlocking, setIsUnlocking] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!decodedEmail) return;
      setIsLoading(true);
      try {
        const [projData, subData, lockData] = await Promise.all([
          projectService.getProjects(decodedEmail),
          subscriptionService.getSubscriptionByEmail(decodedEmail),
          authService.getLockStatus(decodedEmail)
        ]);
        setProjects(projData);
        setSubscription(subData);
        setIsLocked(lockData.isLocked);
        setLoginAttempts(lockData.loginAttempts);
      } catch (err) {
        console.error('Failed to load client detail:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [decodedEmail]);

  const handleUnlock = async () => {
    setIsUnlocking(true);
    try {
      await authService.unlockClient(decodedEmail);
      setIsLocked(false);
      setLoginAttempts(0);
      addToast({
        type: 'success',
        title: 'Account Unlocked',
        description: `${decodedEmail} can now log in again.`
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Unlock Failed',
        description: err instanceof Error ? err.message : 'Could not unlock account.'
      });
    } finally {
      setIsUnlocking(false);
    }
  };

  const clientName = useMemo(
    () => projects[0]?.clientName ?? decodedEmail.split('@')[0],
    [projects, decodedEmail]
  );

  const completedCount = projects.filter(p => p.status === 'Completed' || p.status === 'Delivered').length;
  const inProgressCount = projects.filter(p => p.status !== 'Completed' && p.status !== 'Delivered').length;

  const daysRemaining = subscription ? calculateDaysRemaining(subscription.renewalDate) : 0;

  const getSubStatusDisplay = () => {
    if (!subscription) return null;
    if (subscription.status === 'active') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
          <CheckCircle className="w-3 h-3" /> Active
        </span>
      );
    }
    if (subscription.status === 'renewal_requested') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-amber-500/15 text-amber-500 border border-amber-500/30">
          <Clock className="w-3 h-3" /> Renewal Requested
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-red-500/15 text-red-500 border border-red-500/30">
        <AlertTriangle className="w-3 h-3" /> Expired
      </span>
    );
  };

  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* Back Navigation */}
        <Link
          to="/admin/clients"
          className="inline-flex items-center gap-2 text-sm text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to All Clients
        </Link>

        {/* Account Locked Alert */}
        {!isLoading && isLocked && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/20 border border-red-500/30 shrink-0">
                <ShieldAlert className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-red-500">Account Locked</p>
                <p className="text-xs text-[var(--ink-soft)]">
                  This client has been locked after {loginAttempts} failed login attempt{loginAttempts !== 1 ? 's' : ''}.
                  They cannot log in until unlocked.
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleUnlock}
              isLoading={isUnlocking}
              leftIcon={<LockOpen className="w-3.5 h-3.5" />}
              className="shrink-0 bg-red-500 hover:bg-red-600 border-red-500"
            >
              Unlock Account
            </Button>
          </div>
        )}

        {/* Client Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--contrast)] pb-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2D5BFF]/15 border border-[#2D5BFF]/30">
              <User className="w-7 h-7 text-[#2D5BFF]" />
            </div>
            <div>
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-purple-500">
                Client Detail
              </span>
              {isLoading ? (
                <Skeleton className="h-8 w-48 mt-1" />
              ) : (
                <div className="flex items-center gap-2 mt-0.5">
                  <h1 className="font-heading text-3xl font-extrabold text-[var(--ink)]">
                    {clientName}
                  </h1>
                  {isLocked && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-500/15 text-red-500 border border-red-500/30">
                      <Lock className="w-2.5 h-2.5" /> LOCKED
                    </span>
                  )}
                </div>
              )}
              <p className="text-sm font-mono text-[var(--ink-soft)] mt-0.5">{decodedEmail}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isLocked && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleUnlock}
                isLoading={isUnlocking}
                leftIcon={<LockOpen className="w-3.5 h-3.5" />}
              >
                Unlock Account
              </Button>
            )}
            <Link to="/admin/subscriptions">
              <Button variant="outline" size="sm" leftIcon={<Calendar className="w-3.5 h-3.5" />}>
                Manage Subscription
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card glass>
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b-0">
              <span className="text-xs font-semibold uppercase text-[var(--ink-soft)]">Total Orders</span>
              <Layers className="w-5 h-5 text-[#2D5BFF]" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold font-heading">
                {isLoading ? <Skeleton className="h-9 w-12" /> : projects.length}
              </div>
              <p className="text-xs text-[var(--ink-soft)] mt-1">
                {inProgressCount} in progress · {completedCount} completed
              </p>
            </CardContent>
          </Card>

          <Card glass>
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b-0">
              <span className="text-xs font-semibold uppercase text-[var(--ink-soft)]">Subscription</span>
              <Calendar className="w-5 h-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-9 w-28" />
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {getSubStatusDisplay()}
                    {subscription && (
                      <span className="capitalize text-xs font-semibold text-[#2D5BFF]">
                        {subscription.plan} Plan
                      </span>
                    )}
                  </div>
                  {subscription && (
                    <p className="text-xs text-[var(--ink-soft)]">
                      Renewal: {formatDate(subscription.renewalDate)}
                      {subscription.status === 'active' && daysRemaining <= 7 && daysRemaining >= 0 && (
                        <span className="ml-1 text-amber-500 font-medium">
                          ({daysRemaining}d remaining)
                        </span>
                      )}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card glass>
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b-0">
              <span className="text-xs font-semibold uppercase text-[var(--ink-soft)]">Completed Models</span>
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold font-heading text-emerald-500">
                {isLoading ? <Skeleton className="h-9 w-12" /> : completedCount}
              </div>
              <p className="text-xs text-[var(--ink-soft)] mt-1">Ready for QR scanning &amp; AR delivery</p>
            </CardContent>
          </Card>
        </div>

        {/* All Orders for this Client */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#2D5BFF]" />
            <CardTitle className="text-lg">All Orders</CardTitle>
          </div>

          <Card glass>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3].map(n => <Skeleton key={n} className="h-14 w-full" />)}
                </div>
              ) : projects.length === 0 ? (
                <div className="p-12 text-center text-[var(--ink-soft)]">
                  <Layers className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <h3 className="text-base font-semibold font-heading text-[var(--ink)]">No Orders Found</h3>
                  <p className="text-xs mt-1">This client has no orders in the system.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[var(--surface-soft)] border-b border-[var(--contrast)] text-[var(--ink-soft)] font-mono uppercase">
                      <tr>
                        <th className="px-6 py-3.5">Order ID</th>
                        <th className="px-6 py-3.5">Product Name</th>
                        <th className="px-6 py-3.5">Category</th>
                        <th className="px-6 py-3.5">Pipeline Stage</th>
                        <th className="px-6 py-3.5">Created</th>
                        <th className="px-6 py-3.5">Updated</th>
                        <th className="px-6 py-3.5 text-right">Manage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--contrast)]">
                      {projects.map(project => (
                        <tr key={project.id} className="hover:bg-[var(--surface-soft)] transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-[#2D5BFF]">
                            {project.orderId}
                          </td>
                          <td className="px-6 py-4 font-medium text-[var(--ink)] max-w-xs">
                            <div className="line-clamp-1">{project.productName}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-0.5 rounded-md bg-[var(--surface-soft)] border border-[var(--contrast)] font-mono text-[10px]">
                              {project.productCategory}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <Badge status={project.status} size="sm" />
                          </td>
                          <td className="px-6 py-4 text-[var(--ink-soft)]">
                            {formatDate(project.createdAt)}
                          </td>
                          <td className="px-6 py-4 text-[var(--ink-soft)]">
                            {formatDate(project.updatedAt)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link to={`/admin/orders/${project.id}`}>
                              <Button variant="outline" size="sm" rightIcon={<ExternalLink className="w-3 h-3" />}>
                                Manage
                              </Button>
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
      </div>
    </PageTransition>
  );
};
