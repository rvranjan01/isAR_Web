import { Project, ProjectStatus } from "@/types";
import { fetchClient, isMockMode } from "./api";
import { INITIAL_PROJECTS } from "./mocks/data";
import { notificationService } from "./notificationService";

// In-memory mock store
let mockProjects: Project[] = [...INITIAL_PROJECTS];

export const projectService = {
  async getProjects(clientEmail?: string): Promise<Project[]> {
    if (isMockMode()) {
      await new Promise((res) => setTimeout(res, 300));
      if (clientEmail) {
        const normalized = clientEmail.toLowerCase();
        return mockProjects.filter(
          (p) => p.clientEmail.toLowerCase() === normalized,
        );
      }
      return [...mockProjects];
    }
    const query = clientEmail
      ? `?email=${encodeURIComponent(clientEmail)}`
      : "";
    return fetchClient<Project[]>(`/api/projects${query}`);
  },

  async getProjectById(id: string): Promise<Project | null> {
    if (isMockMode()) {
      await new Promise((res) => setTimeout(res, 200));
      const project = mockProjects.find((p) => p.id === id);
      return project || null;
    }
    return fetchClient<Project>(`/api/projects/${id}`);
  },

  async getPublicProjectById(id: string): Promise<Partial<Project> | null> {
    if (isMockMode()) {
      await new Promise((res) => setTimeout(res, 200));
      const project = mockProjects.find((p) => p.id === id);
      if (!project) return null;
      return {
        id: project.id,
        productName: project.productName,
        arModelUrl: project.arModelUrl,
        status: project.status,
      };
    }
    // Using fetch directly without auth interceptor for public route
    try {
      const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
      const response = await fetch(`${BASE_URL}/api/projects/public/${id}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (e) {
      console.error(e);
      return null;
    }
  },

  async lookupClientByEmail(
    email: string,
  ): Promise<{ exists: boolean; clientName: string | null }> {
    if (isMockMode()) {
      await new Promise((res) => setTimeout(res, 200));
      const normalized = email.toLowerCase();
      const existing = mockProjects.find(
        (p) => p.clientEmail.toLowerCase() === normalized,
      );
      if (existing && existing.clientName) {
        return { exists: true, clientName: existing.clientName };
      }
      return { exists: false, clientName: null };
    }
    return fetchClient<{ exists: boolean; clientName: string | null }>(
      `/api/projects/client-lookup?email=${encodeURIComponent(email)}`,
    );
  },

  async createOrder(data: {
    clientEmail: string;
    clientName?: string;
    productName: string;
    productCategory: "AuRa AR Menu" | "Teleport 3D Twin";
    description: string;
    notes?: string;
    productImageUrl?: string;
    rawAssetFile: File;
  }): Promise<Project> {
    const formData = new FormData();
    formData.append("clientEmail", data.clientEmail);
    if (data.clientName) formData.append("clientName", data.clientName);
    formData.append("productName", data.productName);
    formData.append("productCategory", data.productCategory);
    formData.append("description", data.description);
    if (data.notes) formData.append("notes", data.notes);
    if (data.productImageUrl)
      formData.append("productImageUrl", data.productImageUrl);
    formData.append("rawAsset", data.rawAssetFile);
    formData.append("scanFile", data.rawAssetFile);

    return fetchClient<Project>("/api/projects", {
      method: "POST",
      body: formData,
    });
  },

  async updateProjectStatus(
    id: string,
    status: ProjectStatus,
  ): Promise<Project> {
    if (isMockMode()) {
      await new Promise((res) => setTimeout(res, 300));
      const index = mockProjects.findIndex((p) => p.id === id);
      if (index === -1) throw new Error("Project not found");

      const updated = {
        ...mockProjects[index],
        status,
        updatedAt: new Date().toISOString(),
      };

      // If status updated to Completed and viewer URL missing, auto-generate viewer URL
      if (status === "Completed" && !updated.arViewerUrl) {
        updated.arViewerUrl = `https://ar.immversestudios.com/view/${id}`;
        updated.arModelUrl =
          updated.arModelUrl ||
          `https://assets.immversestudios.com/models/${id}.glb`;
      }

      mockProjects[index] = updated;

      notificationService.addNotification({
        recipientEmail: updated.clientEmail,
        title: `Order Status Updated: ${status}`,
        message: `Your order ${updated.orderId} (${updated.productName}) has moved to stage: ${status}.`,
        type: status === "Completed" ? "success" : "info",
        link: `/orders/${id}`,
      });

      return updated;
    }

    return fetchClient<Project>(`/api/projects/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },


  async uploadARModel(
    id: string,
    fileUrl?: string,
    modelFile?: File | null,
  ): Promise<Project> {
    if (isMockMode()) {
      await new Promise((res) => setTimeout(res, 500));
      const index = mockProjects.findIndex((p) => p.id === id);
      if (index === -1) throw new Error("Project not found");

      const updated: Project = {
        ...mockProjects[index],
        arModelUrl:
          fileUrl || (modelFile ? URL.createObjectURL(modelFile) : undefined),
        updatedAt: new Date().toISOString(),
      };

      mockProjects[index] = updated;
      return updated;
    }

    const formData = new FormData();
    if (fileUrl) formData.append("fileUrl", fileUrl);
    if (modelFile) formData.append("modelFile", modelFile);

    return fetchClient<Project>(`/api/projects/${id}/model`, {
      method: "POST",
      body: formData,
    });
  },

  async handleQRCode(id: string, qrCodeFile?: File | null): Promise<Project> {
    if (isMockMode()) {
      await new Promise((res) => setTimeout(res, 500));
      const index = mockProjects.findIndex((p) => p.id === id);
      if (index === -1) throw new Error("Project not found");

      const updated: Project = {
        ...mockProjects[index],
        qrCodeUrl: qrCodeFile
          ? URL.createObjectURL(qrCodeFile)
          : `mock-qr-${Date.now()}.png`,
        arViewerUrl: `https://ar.immversestudios.com/view/${id}`,
        updatedAt: new Date().toISOString(),
      };

      mockProjects[index] = updated;
      return updated;
    }

    const formData = new FormData();
    if (qrCodeFile) formData.append("qrCodeFile", qrCodeFile);

    return fetchClient<Project>(`/api/projects/${id}/qrcode`, {
      method: "POST",
      body: formData,
    });
  },

  async deleteProject(id: string): Promise<void> {
    if (isMockMode()) {
      await new Promise((res) => setTimeout(res, 300));
      mockProjects = mockProjects.filter((p) => p.id !== id);
      return;
    }

    return fetchClient<void>(`/api/projects/${id}`, {
      method: "DELETE",
    });
  },
};

