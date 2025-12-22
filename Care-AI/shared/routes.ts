import { z } from 'zod';
import { insertReportSchema, insertVitalSchema, insertShareSchema, insertUserSchema, reports, vitals, shares, users } from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  auth: {
    register: {
      method: 'POST' as const,
      path: '/api/register',
      input: insertUserSchema,
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    login: {
      method: 'POST' as const,
      path: '/api/login',
      input: z.object({ username: z.string(), password: z.string() }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/logout',
      responses: {
        200: z.void(),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/user',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    }
  },
  reports: {
    list: {
      method: 'GET' as const,
      path: '/api/reports',
      input: z.object({
        type: z.string().optional(),
        from: z.string().optional(),
        to: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof reports.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/reports',
      // Input is multipart/form-data, schema validation happens on fields
      responses: {
        201: z.custom<typeof reports.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/reports/:id',
      responses: {
        200: z.custom<typeof reports.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/reports/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  vitals: {
    list: {
      method: 'GET' as const,
      path: '/api/vitals',
      input: z.object({
        type: z.string().optional(),
        days: z.coerce.number().optional(), // Last N days
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof vitals.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/vitals',
      input: insertVitalSchema,
      responses: {
        201: z.custom<typeof vitals.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  shares: {
    create: {
      method: 'POST' as const,
      path: '/api/shares',
      input: insertShareSchema,
      responses: {
        201: z.custom<typeof shares.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound, // If username not found
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/shares', // Shared WITH me
      responses: {
        200: z.array(z.custom<typeof shares.$inferSelect & { report: typeof reports.$inferSelect }>()),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
