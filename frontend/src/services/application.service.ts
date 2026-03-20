import type {
  Application,
  ApplicationListResponse,
  ApplicationQuery,
  SubmitApplicationDto,
} from "@/types/application";
import { api } from "./api";

export const applicationService = {
  async submitApplication(payload: SubmitApplicationDto): Promise<Application> {
    const response = await api.post<Application>("/applications", payload);
    return response.data;
  },

  async uploadDocument(
    applicationId: string,
    file: File,
    category?: string,
  ): Promise<Application> {
    const formData = new FormData();
    formData.append("file", file);
    if (category) {
      formData.append("category", category);
    }

    const response = await api.post<Application>(
      `/applications/${applicationId}/documents`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );

    return response.data;
  },

  async getMyApplications(
    query: ApplicationQuery = {},
  ): Promise<ApplicationListResponse> {
    const response = await api.get<ApplicationListResponse>(
      "/applications/my",
      {
        params: query,
      },
    );
    return response.data;
  },

  async getMyApplicationHistory(
    query: ApplicationQuery = {},
  ): Promise<ApplicationListResponse> {
    const response = await api.get<ApplicationListResponse>(
      "/applications/history",
      {
        params: query,
      },
    );
    return response.data;
  },

  async getReceivedApplications(
    query: ApplicationQuery = {},
  ): Promise<ApplicationListResponse> {
    const response = await api.get<ApplicationListResponse>(
      "/applications/received",
      {
        params: query,
      },
    );
    return response.data;
  },

  async getApplicationById(id: string): Promise<Application> {
    const response = await api.get<Application>(`/applications/${id}`);
    return response.data;
  },

  async withdrawApplication(id: string, reason?: string): Promise<Application> {
    const response = await api.patch<Application>(
      `/applications/${id}/withdraw`,
      {
        reason,
      },
    );
    return response.data;
  },

  async requestAdditionalDocuments(
    id: string,
    requestedDocuments: string[],
    note?: string,
    applicationDeadline?: string,
  ): Promise<Application> {
    const response = await api.patch<Application>(
      `/applications/${id}/request-documents`,
      {
        requestedDocuments,
        note,
        applicationDeadline,
      },
    );
    return response.data;
  },

  async approveApplication(id: string): Promise<Application> {
    const response = await api.patch<Application>(
      `/applications/${id}/approve`,
    );
    return response.data;
  },

  async rejectApplication(id: string, reason: string): Promise<Application> {
    const response = await api.patch<Application>(
      `/applications/${id}/reject`,
      {
        reason,
      },
    );
    return response.data;
  },

  async scheduleViewing(
    id: string,
    scheduledAt: string,
    location?: string,
    notes?: string,
  ): Promise<Application> {
    const response = await api.patch<Application>(
      `/applications/${id}/schedule-viewing`,
      {
        scheduledAt,
        location,
        notes,
      },
    );

    return response.data;
  },
};

export default applicationService;
