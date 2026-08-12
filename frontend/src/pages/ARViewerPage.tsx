import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { projectService } from "@/services/projectService";
import { Project } from "@/types";
import { PageTransition } from "@/components/layout/PageTransition";
import { Box } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";

export const ARViewerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Partial<Project> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const data = await projectService.getPublicProjectById(id);
        setProject(data);
      } catch (err) {
        console.error("Failed to fetch public project detail:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProject();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[var(--paper)]">
        <div className="flex flex-col items-center space-y-4">
          <Skeleton className="h-64 w-64 rounded-xl" />
          <p className="text-sm font-medium text-[var(--ink-soft)] animate-pulse">Loading 3D AR Experience...</p>
        </div>
      </div>
    );
  }

  if (!project || !project.arModelUrl) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-[var(--paper)] space-y-4 px-4 text-center">
        <div className="p-6 rounded-full bg-[var(--surface-soft)] text-[#2D5BFF] border border-[var(--contrast)]">
          <Box className="w-12 h-12 opacity-60" />
        </div>
        <h2 className="text-xl font-bold font-heading text-[var(--ink)]">3D Model Not Available</h2>
        <p className="text-sm text-[var(--ink-soft)] max-w-md">
          The AR asset for this order is currently being processed or does not exist. Please check back later.
        </p>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="h-screen w-full bg-[#1A1A1A] text-white flex flex-col relative overflow-hidden">
        {/* Minimal Header */}
        <header className="absolute top-0 left-0 w-full p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-[#2D5BFF] to-[#69D2E7] flex items-center justify-center">
              <Box className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-sm font-bold tracking-tight text-white/90 drop-shadow-md">
              {project.productName || "AR Viewer"}
            </h1>
          </div>
          <div className="text-[10px] font-mono uppercase tracking-wider px-2 py-1 bg-black/40 rounded-full border border-white/10 backdrop-blur-sm">
            Immverse AR
          </div>
        </header>

        {/* 3D Model Viewer Fullscreen */}
        <div className="flex-1 w-full h-full">
          <model-viewer
            src={project.arModelUrl}
            alt={project.productName || "3D Model"}
            auto-rotate
            camera-controls
            ar
            ar-modes="webxr scene-viewer quick-look"
            shadow-intensity="1"
            environment-image="neutral"
            exposure="1"
            style={{ width: "100%", height: "100%", backgroundColor: "#1A1A1A" }}
          ></model-viewer>
        </div>
        
        {/* Instructions Overlay */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-xs text-white/80 whitespace-nowrap shadow-xl pointer-events-none">
          Drag to rotate • Pinch to zoom • Tap AR icon to place
        </div>
      </div>
    </PageTransition>
  );
};
