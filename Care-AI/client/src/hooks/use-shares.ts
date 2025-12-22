import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type InsertShare } from "@shared/routes";
import { z } from "zod";

export function useShares(enabled = true) {
  return useQuery({
    queryKey: [api.shares.list.path],
    queryFn: async () => {
      const res = await fetch(api.shares.list.path, {
        credentials: 'include', // Include cookies for session
      });
      
      if (res.status === 401) {
        // Unauthorized - return empty array instead of throwing
        return [];
      }
      
      if (!res.ok) {
        throw new Error(`Failed to fetch shared reports: ${res.status}`);
      }
      
      return api.shares.list.responses[200].parse(await res.json());
    },
    enabled, // Only run when enabled (user is authenticated)
    retry: false, // Don't retry - let ProtectedRoute handle authentication
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
}

export function useShareReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertShare) => {
      const res = await fetch(api.shares.create.path, {
        method: api.shares.create.method,
        headers: { "Content-Type": "application/json" },
        credentials: 'include', // Include cookies for session
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.shares.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        if (res.status === 404) {
          throw new Error("User not found to share with");
        }
        throw new Error("Failed to share report");
      }
      return api.shares.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      // Invalidate shares if we were viewing outgoing shares (not implemented yet, but good practice)
    },
  });
}
