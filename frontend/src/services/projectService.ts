import { Project, ProjectStatus } from "@/types";
import { fetchClient, isMockMode } from "./api";
import { INITIAL_PROJECTS } from "./mocks/data";

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

  async createOrder(data: {
    clientEmail: string;
    clientName: string;
    productName: string;
    productCategory: "AuRa AR Menu" | "Teleport 3D Twin";
    description: string;
    notes?: string;
    productImageUrl?: string;
  }): Promise<Project> {
    if (isMockMode()) {
      await new Promise((res) => setTimeout(res, 400));
      const randomOrderNum = Math.floor(1000 + Math.random() * 9000);
      const orderId = `ORD-${randomOrderNum}`;
      const newId = `proj-${randomOrderNum}-${Date.now().toString().slice(-4)}`;

      const newProject: Project = {
        id: newId,
        orderId,
        clientEmail: data.clientEmail,
        clientName: data.clientName,
        productName: data.productName,
        productCategory: data.productCategory,
        description: data.description,
        status: "Uploaded",
        productImageUrl:
          data.productImageUrl ||
          "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        notes: data.notes,
      };

      mockProjects.unshift(newProject);
      return newProject;
    }

    return fetchClient<Project>("/api/projects", {
      method: "POST",
      body: JSON.stringify(data),
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
};
