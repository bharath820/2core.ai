import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type InsertVital } from "@shared/routes";
import { z } from "zod";

export function useVitals(filters?: { type?: string; days?: number }, enabled = true) {
  return useQuery({
    queryKey: [api.vitals.list.path, filters],
    queryFn: async () => {
      let url = api.vitals.list.path;
      if (filters) {
        const params = new URLSearchParams();
        if (filters.type && filters.type !== "all") params.append("type", filters.type);
        if (filters.days) params.append("days", filters.days.toString());
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
        throw new Error(`Failed to fetch vitals: ${res.status}`);
      }
      
      return api.vitals.list.responses[200].parse(await res.json());
    },
    enabled, // Only run when enabled (user is authenticated)
    retry: false, // Don't retry - let ProtectedRoute handle authentication
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
}

export function useCreateVital() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertVital) => {
      const res = await fetch(api.vitals.create.path, {
        method: api.vitals.create.method,
        headers: { "Content-Type": "application/json" },
        credentials: 'include', // Include cookies for session
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.vitals.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to log vital");
      }
      return api.vitals.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.vitals.list.path] });
    },
  });
}
