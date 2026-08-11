import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectService } from '@/services/projectService';
import { subscriptionService } from '@/services/subscriptionService';
import { Project, Subscription, ProjectStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDate } from '@/lib/utils';
import {
  PlusCircle,
  Users,
  ArrowRight
} from 'lucide-react';
import { PageTransition } from '@/components/layout/PageTransition';

export const AdminDashboardPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [projData, subData] = await Promise.all([
          projectService.getProjects(),
          subscriptionService.getSubscriptions()
        ]);
        setProjects(projData);
        setSubscriptions(subData);
      } catch (err) {
        console.error('Failed to fetch admin overview data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const countByStatus = (status: ProjectStatus) =>
    projects.filter(p => p.status === status).length;

  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--contrast)] pb-6">
          <div>
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-purple-500">
              Immverse Operations Control
            </span>
            <h1 className="font-heading text-3xl font-extrabold text-[var(--ink)] mt-1">
              Admin Overview Dashboard
            </h1>
            <p className="text-sm text-[var(--ink-soft)] mt-1">
              Manage client AR orders, 3D modeling pipelines, and subscriptions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/admin/orders/new">
              <Button variant="primary" leftIcon={<PlusCircle className="w-4 h-4" />}>
                Create New Order
              </Button>
            </Link>
            <Link to="/admin/subscriptions">
              <Button variant="outline" leftIcon={<Users className="w-4 h-4" />}>
                Subscriptions
              </Button>
            </Link>
          </div>
        </div>

        {/* Top Metric Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card glass>
            <CardContent className="p-4 text-center">
              <div className="text-xs text-[var(--ink-soft)] font-medium">Total Orders</div>
              <div className="text-2xl font-bold font-heading text-[var(--ink)] mt-1">
                {isLoading ? <Skeleton className="h-8 w-10 mx-auto" /> : projects.length}
              </div>
              <div className="text-[10px] text-[var(--ink-soft)] mt-0.5">All clients</div>
            </CardContent>
          </Card>

          <Card glass>
            <CardContent className="p-4 text-center">
              <div className="text-xs text-amber-500 font-medium">Pending Review</div>
              <div className="text-2xl font-bold font-heading text-amber-500 mt-1">
                {isLoading ? <Skeleton className="h-8 w-10 mx-auto" /> : countByStatus('Pending Review')}
              </div>
              <div className="text-[10px] text-[var(--ink-soft)] mt-0.5">Needs action</div>
            </CardContent>
          </Card>

          <Card glass>
            <CardContent className="p-4 text-center">
              <div className="text-xs text-blue-500 font-medium">AR In Progress</div>
              <div className="text-2xl font-bold font-heading text-blue-500 mt-1">
                {isLoading ? <Skeleton className="h-8 w-10 mx-auto" /> : countByStatus('AR In Progress')}
              </div>
              <div className="text-[10px] text-[var(--ink-soft)] mt-0.5">Modeling</div>
            </CardContent>
          </Card>

          <Card glass>
            <CardContent className="p-4 text-center">
              <div className="text-xs text-purple-500 font-medium">Quality Check</div>
              <div className="text-2xl font-bold font-heading text-purple-500 mt-1">
                {isLoading ? <Skeleton className="h-8 w-10 mx-auto" /> : countByStatus('Quality Check')}
              </div>
              <div className="text-[10px] text-[var(--ink-soft)] mt-0.5">QA testing</div>
            </CardContent>
          </Card>

          <Card glass>
            <CardContent className="p-4 text-center">
              <div className="text-xs text-emerald-500 font-medium">Completed</div>
              <div className="text-2xl font-bold font-heading text-emerald-500 mt-1">
                {isLoading ? <Skeleton className="h-8 w-10 mx-auto" /> : countByStatus('Completed')}
              </div>
              <div className="text-[10px] text-[var(--ink-soft)] mt-0.5">QR Generated</div>
            </CardContent>
          </Card>

          <Card glass>
            <CardContent className="p-4 text-center">
              <div className="text-xs text-teal-500 font-medium">Delivered</div>
              <div className="text-2xl font-bold font-heading text-teal-500 mt-1">
                {isLoading ? <Skeleton className="h-8 w-10 mx-auto" /> : countByStatus('Delivered')}
              </div>
              <div className="text-[10px] text-[var(--ink-soft)] mt-0.5">Live on site</div>
            </CardContent>
          </Card>
        </div>

        {/* Pipeline & Recent Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Cols: Orders Table */}
          <Card glass className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Recent AR Orders</CardTitle>
                <CardDescription>Latest client product orders submitted to the platform</CardDescription>
              </div>
              <Link to="/admin/orders">
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  View All Orders
                </Button>
              </Link>
            </CardHeader>

            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3].map(n => <Skeleton key={n} className="h-12 w-full" />)}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[var(--surface-soft)] border-b border-[var(--contrast)] text-[var(--ink-soft)] font-mono uppercase">
                      <tr>
                        <th className="px-6 py-3">Order ID</th>
                        <th className="px-6 py-3">Client / Company</th>
                        <th className="px-6 py-3">Product Name</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--contrast)]">
                      {projects.slice(0, 5).map(project => (
                        <tr key={project.id} className="hover:bg-[var(--surface-soft)] transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-[#2D5BFF]">
                            {project.orderId}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-[var(--ink)]">{project.clientName}</div>
                            <div className="text-[10px] text-[var(--ink-soft)]">{project.clientEmail}</div>
                          </td>
                          <td className="px-6 py-4 font-medium text-[var(--ink)]">
                            {project.productName}
                          </td>
                          <td className="px-6 py-4">
                            <Badge status={project.status} size="sm" />
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link to={`/admin/orders/${project.id}`}>
                              <Button variant="outline" size="sm">
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

          {/* Right Col: Subscriptions Summary */}
          <Card glass className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Subscription Health</CardTitle>
                <CardDescription>Client plan status overview</CardDescription>
              </div>
              <Link to="/admin/subscriptions">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-soft)] border border-[var(--contrast)]">
                    <span className="text-xs text-[var(--ink-soft)] font-medium">Active Client Plans</span>
                    <span className="font-bold text-emerald-500 font-mono">
                      {subscriptions.filter(s => s.status === 'active').length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-soft)] border border-[var(--contrast)]">
                    <span className="text-xs text-[var(--ink-soft)] font-medium">Expired Plans</span>
                    <span className="font-bold text-red-500 font-mono">
                      {subscriptions.filter(s => s.status === 'expired').length}
                    </span>
                  </div>

                  <div className="pt-2">
                    <h5 className="text-xs font-semibold uppercase text-[var(--ink-soft)] mb-2">Expiring Clients</h5>
                    <div className="space-y-2">
                      {subscriptions.map(sub => (
                        <div key={sub.id} className="p-2.5 rounded-xl border border-[var(--contrast)] bg-[var(--surface)] text-xs flex items-center justify-between">
                          <div>
                            <span className="font-semibold block">{sub.clientName}</span>
                            <span className="text-[10px] text-[var(--ink-soft)]">Renewal: {formatDate(sub.renewalDate)}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono capitalize ${
                            sub.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                          }`}>
                            {sub.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
};
