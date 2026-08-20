import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { projectService } from "@/services/projectService";
import { Project } from "@/types";
import { PageTransition } from "@/components/layout/PageTransition";
import { Box, RotateCcw, Smartphone, ArrowLeft, Sparkles, RefreshCw, Layers } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";

// Public reliable 3D sample fallback model
const FALLBACK_GLB_URL = "https://modelviewer.dev/shared-assets/models/Astronaut.glb";

export const ARViewerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [project, setProject] = useState<Partial<Project> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modelError, setModelError] = useState(false);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [isLaunchingAR, setIsLaunchingAR] = useState(false);
  const modelViewerRef = useRef<HTMLElement | null>(null);
  const autoARTriggeredRef = useRef(false);

  // Check if auto AR is disabled via query param (e.g. user returned from AR or fallback)
  const isNoAutoAR = searchParams.get("no_ar") === "true";

  // Ensure model-viewer script is injected even in isolated local environments
  useEffect(() => {
    if (!document.querySelector('script[src*="model-viewer"]')) {
      const script = document.createElement("script");
      script.type = "module";
      script.src = "https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js";
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;
      setIsLoading(true);
      setModelError(false);
      setIsUsingFallback(false);
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

  const rawModelUrl = project?.arModelUrl;
  const isMockDomain = rawModelUrl?.includes("assets.immversestudios.com");
  const effectiveModelUrl = isUsingFallback || isMockDomain
    ? FALLBACK_GLB_URL
    : (rawModelUrl || FALLBACK_GLB_URL);

  // Automatically trigger native AR experience on supported devices
  const triggerAutoAR = useCallback((modelUrl: string, productName?: string) => {
    if (autoARTriggeredRef.current || isNoAutoAR || !id) return;

    // Check if auto AR was already launched in this session for this project
    const sessionKey = `ar_auto_launched_${id}`;
    if (sessionStorage.getItem(sessionKey)) {
      return;
    }

    const ua = navigator.userAgent || "";
    const isAndroid = /android/i.test(ua);
    const isIOS = /iPad|iPhone|iPod/.test(ua) || 
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    if (isAndroid) {
      autoARTriggeredRef.current = true;
      sessionStorage.setItem(sessionKey, "true");
      setIsLaunchingAR(true);

      // Construct Android Scene Viewer Intent
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set("no_ar", "true");
      const fallbackUrl = currentUrl.toString();

      const title = encodeURIComponent(productName || "3D AR Model");
      const fileUrl = encodeURIComponent(modelUrl);
      const sceneViewerIntent = `intent://arvr.google.com/scene-viewer/1.0?file=${fileUrl}&mode=ar_preferred&title=${title}&resizable=true#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;S.browser_fallback_url=${encodeURIComponent(fallbackUrl)};end;`;

      // Redirect to native Scene Viewer
      const timer = setTimeout(() => {
        window.location.href = sceneViewerIntent;
      }, 300);

      // Revert loading indicator after brief delay if intent handling remains in-browser
      const safetyTimer = setTimeout(() => {
        setIsLaunchingAR(false);
      }, 3500);

      return () => {
        clearTimeout(timer);
        clearTimeout(safetyTimer);
      };
    } else if (isIOS) {
      // For iOS Quick Look via model-viewer
      const viewer = modelViewerRef.current as any;
      if (viewer && typeof viewer.activateAR === "function") {
        autoARTriggeredRef.current = true;
        sessionStorage.setItem(sessionKey, "true");
        setIsLaunchingAR(true);
        try {
          viewer.activateAR();
        } catch (e) {
          console.warn("Auto iOS AR activation error:", e);
        } finally {
          setTimeout(() => setIsLaunchingAR(false), 2000);
        }
      }
    }
  }, [id, isNoAutoAR]);

  // Handle Android auto-launch once project is loaded
  useEffect(() => {
    if (!project || isLoading) return;

    const ua = navigator.userAgent || "";
    const isAndroid = /android/i.test(ua);
    if (isAndroid && effectiveModelUrl) {
      triggerAutoAR(effectiveModelUrl, project.productName);
    }
  }, [project, isLoading, effectiveModelUrl, triggerAutoAR]);

  // Handle model-viewer load and error events
  useEffect(() => {
    const viewer = modelViewerRef.current;
    if (!viewer) return;

    const handleLoad = () => {
      setModelLoaded(true);
      setModelError(false);

      // For iOS, try auto-activating AR when model is loaded in viewer
      const ua = navigator.userAgent || "";
      const isIOS = /iPad|iPhone|iPod/.test(ua) || 
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

      if (isIOS && effectiveModelUrl) {
        triggerAutoAR(effectiveModelUrl, project?.productName);
      }
    };

    const handleError = () => {
      console.warn("Primary 3D GLB model failed to load. Switching to sample fallback.");
      if (!isUsingFallback) {
        setIsUsingFallback(true);
        setModelError(false);
      } else {
        setModelError(true);
      }
    };

    viewer.addEventListener("load", handleLoad);
    viewer.addEventListener("error", handleError);

    return () => {
      viewer.removeEventListener("load", handleLoad);
      viewer.removeEventListener("error", handleError);
    };
  }, [project, isUsingFallback, effectiveModelUrl, triggerAutoAR]);

  const resetCamera = () => {
    const viewer = modelViewerRef.current as any;
    if (viewer && typeof viewer.resetTurntableRotation === "function") {
      viewer.resetTurntableRotation();
    }
  };

  const manualLaunchAR = () => {
    const viewer = modelViewerRef.current as any;
    if (viewer && typeof viewer.activateAR === "function") {
      viewer.activateAR();
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#111111] text-white">
        <div className="flex flex-col items-center space-y-4">
          <Skeleton className="h-64 w-64 rounded-2xl bg-white/10" />
          <p className="text-sm font-medium text-white/70 animate-pulse">
            Loading Web AR Experience...
          </p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-[#111111] text-white space-y-4 px-4 text-center">
        <div className="p-6 rounded-full bg-white/5 text-[#2D5BFF] border border-white/10">
          <Box className="w-12 h-12 opacity-60" />
        </div>
        <h2 className="text-xl font-bold font-heading text-white">
          Order Experience Not Found
        </h2>
        <p className="text-sm text-white/60 max-w-md">
          The requested 3D AR experience link is invalid or may have been removed.
        </p>
        <Link to="/login">
          <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Portal
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="h-screen w-full bg-[#121316] text-white flex flex-col relative overflow-hidden select-none">
        {/* AR Launching Overlay Banner */}
        {isLaunchingAR && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-[#2D5BFF]/90 backdrop-blur-md px-6 py-2.5 rounded-full border border-white/20 text-xs font-semibold text-white shadow-2xl flex items-center gap-2 animate-pulse">
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span>Launching Augmented Reality...</span>
          </div>
        )}

        {/* Top Floating Glass Header */}
        <header className="absolute top-0 left-0 w-full p-4 flex items-center justify-between z-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2D5BFF] to-[#69D2E7] flex items-center justify-center shadow-glow">
              <Box className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white drop-shadow-md">
                {project.productName || "Interactive 3D View"}
              </h1>
              <p className="text-[10px] text-white/60 font-mono">
                {project.orderId ? `Order: ${project.orderId}` : "Web AR 3D Twin"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            {(isUsingFallback || isMockDomain) && (
              <span className="text-[10px] font-mono px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full">
                Demo 3D Model
              </span>
            )}
            <div className="text-[10px] font-mono uppercase tracking-wider px-3 py-1 bg-black/60 rounded-full border border-white/10 backdrop-blur-md text-white/80">
              Immverse AR
            </div>
          </div>
        </header>

        {/* 3D Model Viewer Fullscreen */}
        <div className="flex-1 w-full h-full relative">
          <model-viewer
            ref={modelViewerRef as any}
            src={effectiveModelUrl}
            alt={project.productName || "3D Model"}
            auto-rotate
            rotation-per-second="20deg"
            camera-controls
            touch-action="pan-y"
            ar
            ar-modes="scene-viewer webxr quick-look"
            ar-scale="auto"
            ar-placement="floor"
            shadow-intensity="1.2"
            shadow-softness="0.8"
            environment-image="neutral"
            exposure="1.0"
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: "#121316",
            }}
          ></model-viewer>

          {/* Quick Toolbar Controls */}
          <div className="absolute right-4 bottom-20 flex flex-col gap-2 z-20">
            <button
              onClick={resetCamera}
              className="p-3 rounded-full bg-black/60 hover:bg-black/80 border border-white/15 text-white backdrop-blur-md shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95"
              title="Reset 3D Camera"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Instructions Overlay */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 bg-black/60 backdrop-blur-lg px-5 py-2.5 rounded-full border border-white/15 text-xs text-white/90 whitespace-nowrap shadow-2xl flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-[#2D5BFF]" />
          <span>Move, rotate, and scale 3D model • View in real world on mobile</span>
        </div>
      </div>
    </PageTransition>
  );
};


