import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { projectService } from "@/services/projectService";
import { Project } from "@/types";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { PIPELINE_STAGES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { PlusCircle, Search, Layers, ExternalLink } from "lucide-react";
import { PageTransition } from "@/components/layout/PageTransition";

export const AdminOrdersPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      try {
        const data = await projectService.getProjects();
        setProjects(data);
      } catch (err) {
        console.error("Failed to fetch admin projects list:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesQuery =
        p.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.clientEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.productName.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesQuery) return false;

      if (selectedStatus !== "ALL") {
        return p.status === selectedStatus;
      }
      return true;
    });
  }, [projects, searchQuery, selectedStatus]);

  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--contrast)] pb-6">
          <div>
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-purple-500">
              Pipeline Management
            </span>
            <h1 className="font-heading text-3xl font-extrabold text-[var(--ink)] mt-1">
              All Client AR Orders
            </h1>
            <p className="text-sm text-[var(--ink-soft)] mt-1">
              Filter, search, and manage 3D modeling stages across all customer
              accounts.
            </p>
          </div>

          <Link to="/admin/orders/new">
            <Button
              variant="primary"
              leftIcon={<PlusCircle className="w-4 h-4" />}
            >
              Create New Order
            </Button>
          </Link>
        </div>

        {/* Filter & Search Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto p-1 bg-[var(--surface-soft)] rounded-xl border border-[var(--contrast)]">
            <button
              onClick={() => setSelectedStatus("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                selectedStatus === "ALL"
                  ? "bg-[var(--surface)] text-[var(--ink)] font-semibold shadow-xs"
                  : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
              }`}
            >
              All ({projects.length})
            </button>
            {PIPELINE_STAGES.map((stage) => {
              const count = projects.filter((p) => p.status === stage).length;
              return (
                <button
                  key={stage}
                  onClick={() => setSelectedStatus(stage)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors whitespace-nowrap ${
                    selectedStatus === stage
                      ? "bg-[var(--surface)] text-[var(--ink)] font-semibold shadow-xs"
                      : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
                  }`}
                >
                  {stage} ({count})
                </button>
              );
            })}
          </div>

          <div className="w-full md:w-72">
            <Input
              placeholder="Search email, Order ID..."
              leftIcon={<Search className="w-4 h-4" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Orders Table */}
        <Card glass>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4].map((n) => (
                  <Skeleton key={n} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="p-12 text-center text-[var(--ink-soft)]">
                <Layers className="w-12 h-12 mx-auto mb-3 opacity-40 text-[var(--ink-soft)]" />
                <h3 className="text-base font-semibold font-heading text-[var(--ink)]">
                  No Orders Match Filter
                </h3>
                <p className="text-xs mt-1">
                  Try adjusting your status tab or search phrase.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--surface-soft)] border-b border-[var(--contrast)] text-[var(--ink-soft)] font-mono uppercase">
                    <tr>
                      <th className="px-6 py-3.5">Order ID</th>
                      <th className="px-6 py-3.5">Client & Email</th>
                      <th className="px-6 py-3.5">Product Name</th>
                      <th className="px-6 py-3.5">Category</th>
                      <th className="px-6 py-3.5">Pipeline Stage</th>
                      <th className="px-6 py-3.5">Created Date</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--contrast)]">
                    {filteredProjects.map((project) => (
                      <tr
                        key={project.id}
                        className="hover:bg-[var(--surface-soft)] transition-colors"
                      >
                        <td className="px-6 py-4 font-mono font-bold text-[#2D5BFF]">
                          {project.orderId}
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            to={`/admin/clients/${encodeURIComponent(project.clientEmail)}`}
                            className="font-semibold text-[var(--ink)] hover:text-[#2D5BFF] transition-colors"
                            title={`View all orders for ${project.clientEmail}`}
                          >
                            {project.clientName}
                          </Link>
                          <Link
                            to={`/admin/clients/${encodeURIComponent(project.clientEmail)}`}
                            className="block text-[10px] text-[var(--ink-soft)] hover:text-[#2D5BFF] transition-colors"
                          >
                            {project.clientEmail}
                          </Link>
                        </td>
                        <td className="px-6 py-4 font-medium text-[var(--ink)]">
                          {project.productName}
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
                        <td className="px-6 py-4 text-right">
                          <Link to={`/admin/orders/${project.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              rightIcon={<ExternalLink className="w-3 h-3" />}
                            >
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
    </PageTransition>
  );
};
