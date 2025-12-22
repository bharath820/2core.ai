import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

export function useReports(filters?: { type?: string; from?: string; to?: string }, enabled = true) {
  return useQuery({
    queryKey: [api.reports.list.path, filters],
    queryFn: async () => {
      let url = api.reports.list.path;
      if (filters) {
        const params = new URLSearchParams();
        if (filters.type && filters.type !== "all") params.append("type", filters.type);
        if (filters.from) params.append("from", filters.from);
        if (filters.to) params.append("to", filters.to);
        if (params.toString()) url += `?${params.toString()}`;
      }

      const res = await fetch(url, {
        credentials: 'include', // Include cookies for session
      });
      
      if (res.status === 401) {
        // Unauthorized - return empty array instead of throwing
        // This prevents infinite retry loops
        return [];
      }
      
      if (!res.ok) {
        throw new Error(`Failed to fetch reports: ${res.status}`);
      }
      
      return api.reports.list.responses[200].parse(await res.json());
    },
    enabled, // Only run when enabled (user is authenticated)
    retry: false, // Don't retry - let ProtectedRoute handle authentication
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
}

export function useCreateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      // NOTE: Content-Type header must NOT be set manually for FormData, browser sets it with boundary
      const res = await fetch(api.reports.create.path, {
        method: api.reports.create.method,
        credentials: 'include', // Include cookies for session
        body: formData,
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.reports.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to upload report");
      }
      return api.reports.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.reports.list.path] });
    },
  });
}

export function useDeleteReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.reports.delete.path, { id });
      const res = await fetch(url, { 
        method: api.reports.delete.method,
        credentials: 'include', // Include cookies for session
      });
      if (res.status === 404) throw new Error("Report not found");
      if (!res.ok) throw new Error("Failed to delete report");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.reports.list.path] });
    },
  });
}
