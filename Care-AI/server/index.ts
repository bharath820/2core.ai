import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer, Server as HttpServer } from "http";
import { exec } from "child_process";
import { promisify } from "util";
import { createServer as createNetServer } from "net";

const execAsync = promisify(exec);
const app = express();
const httpServer = createServer(app);

// Utility function to check if a port is available
function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createNetServer();
    let resolved = false;
    
    const cleanup = () => {
      if (!resolved) {
        resolved = true;
        server.removeAllListeners();
        server.once("close", () => {});
        try {
          server.close();
        } catch {
          // Ignore errors during cleanup
        }
      }
    };
    
    server.once("listening", () => {
      cleanup();
      resolve(true);
    });
    
    server.once("error", (err: NodeJS.ErrnoException) => {
      cleanup();
      resolve(err.code === "EADDRINUSE" ? false : true);
    });
    
    try {
      server.listen(port, "127.0.0.1");
    } catch {
      cleanup();
      resolve(false);
    }
    
    // Timeout after 2 seconds
    setTimeout(() => {
      if (!resolved) {
        cleanup();
        resolve(false);
      }
    }, 2000);
  });
}

// Find an available port starting from the given port
async function findAvailablePort(startPort: number, maxAttempts = 10): Promise<number> {
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i;
    const available = await isPortAvailable(port);
    if (available) {
      return port;
    }
  }
  throw new Error(`Could not find an available port starting from ${startPort}`);
}

// Try to kill a process on Windows
async function tryKillProcessOnPort(port: number): Promise<boolean> {
  if (process.platform !== "win32") {
    return false;
  }

  try {
    // Find process using the port
    const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
    const lines = stdout.split("\n").filter((line: string) => 
      line.includes("LISTENING") && line.includes(`:${port}`)
    );
    
    if (lines.length === 0) {
      return false;
    }

    // Extract PID from the line
    let pid: string | null = null;
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const potentialPid = parts[parts.length - 1];
      if (potentialPid && potentialPid !== "0" && !isNaN(Number(potentialPid))) {
        pid = potentialPid;
        break;
      }
    }

    if (!pid) {
      return false;
    }

    // Try to get process info
    try {
      const { stdout: tasklistOutput } = await execAsync(`tasklist /FI "PID eq ${pid}" /FO CSV`);
      const isNodeProcess = tasklistOutput.includes("node.exe") || 
                           tasklistOutput.includes("tsx.exe") ||
                           tasklistOutput.includes("electron.exe");
      
      if (isNodeProcess) {
        log(`   Attempting to kill process (PID: ${pid}) on port ${port}...`);
        try {
          await execAsync(`taskkill /PID ${pid} /F`);
          // Wait for port to be released with retries
          for (let i = 0; i < 5; i++) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const available = await isPortAvailable(port);
            if (available) {
              return true;
            }
          }
          return false;
        } catch (killError: any) {
          // Process might have already terminated
          if (killError.message && killError.message.includes("not found")) {
            // Check if port is now available
            const available = await isPortAvailable(port);
            return available;
          }
          return false;
        }
      } else {
        log(`   Port ${port} is used by a non-Node.js process (PID: ${pid}). Cannot auto-kill.`);
        return false;
      }
    } catch {
      // Try to kill anyway if we can't identify the process
      log(`   Attempting to kill process (PID: ${pid}) on port ${port}...`);
      try {
        await execAsync(`taskkill /PID ${pid} /F`);
        await new Promise(resolve => setTimeout(resolve, 1500));
        const available = await isPortAvailable(port);
        return available;
      } catch {
        return false;
      }
    }
  } catch {
    // Command failed, port might be free
    return false;
  }
}

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  let preferredPort = parseInt(process.env.PORT || "3001", 10);
  const host = process.env.HOST || "localhost";
  const autoFindPort = process.env.AUTO_FIND_PORT !== "false"; // Default to true
  
  // Check if port is available, if not try to free it or find another
  let actualPort = preferredPort;
  let portAvailable = await isPortAvailable(preferredPort);
  
  if (!portAvailable) {
    log(`⚠️  Port ${preferredPort} is already in use.`);
    
    if (autoFindPort) {
      // Try to kill process on the port
      log(`   Attempting to free port ${preferredPort}...`);
      const killed = await tryKillProcessOnPort(preferredPort);
      
      if (killed) {
        // Re-verify port is actually available
        portAvailable = await isPortAvailable(preferredPort);
        if (portAvailable) {
          log(`✓ Successfully freed port ${preferredPort}`);
          actualPort = preferredPort;
        } else {
          log(`   Port ${preferredPort} still not available after kill attempt.`);
          // Fall through to find another port
        }
      }
      
      // If port is still not available, find another one
      if (!portAvailable) {
        log(`   Searching for an available port...`);
        try {
          actualPort = await findAvailablePort(preferredPort);
          log(`✓ Found available port: ${actualPort}`);
          if (actualPort !== preferredPort) {
            log(`   Note: Server will run on port ${actualPort} instead of ${preferredPort}`);
            log(`   Update Vite proxy config if using separate frontend dev server`);
          }
        } catch (err) {
          log(`❌ Could not find an available port. Please free up port ${preferredPort} manually.`);
          if (process.platform === "win32") {
            try {
              const { stdout } = await execAsync(`netstat -ano | findstr :${preferredPort}`);
              const lines = stdout.split("\n").filter((line: string) => line.includes("LISTENING"));
              if (lines.length > 0) {
                const parts = lines[0].trim().split(/\s+/);
                const pid = parts[parts.length - 1];
                if (pid && pid !== "0") {
                  log(`   Process ID: ${pid}`);
                  log(`   Kill command: taskkill /PID ${pid} /F`);
                }
              }
            } catch {
              // Ignore
            }
          }
          log(`   Or set a different port: $env:PORT=5001; npm run dev`);
          process.exit(1);
        }
      }
    } else {
      log(`   Auto-find port is disabled. Please free port ${preferredPort} or set AUTO_FIND_PORT=true`);
      if (process.platform === "win32") {
        try {
          const { stdout } = await execAsync(`netstat -ano | findstr :${preferredPort}`);
          const lines = stdout.split("\n").filter((line: string) => line.includes("LISTENING"));
          if (lines.length > 0) {
            const parts = lines[0].trim().split(/\s+/);
            const pid = parts[parts.length - 1];
            if (pid && pid !== "0") {
              log(`   Process ID: ${pid}`);
              log(`   Kill command: taskkill /PID ${pid} /F`);
            }
          }
        } catch {
          // Ignore
        }
      }
      process.exit(1);
    }
  }
  
  httpServer.on("error", async (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      log(`❌ Port ${actualPort} is still in use after checks.`);
      
      // Try to find and suggest killing the process (Windows)
      if (process.platform === "win32") {
        try {
          const { stdout } = await execAsync(`netstat -ano | findstr :${actualPort}`);
          const lines = stdout.split("\n").filter((line: string) => line.includes("LISTENING"));
          if (lines.length > 0) {
            const parts = lines[0].trim().split(/\s+/);
            const pid = parts[parts.length - 1];
            if (pid && pid !== "0") {
              log(`   Process ID using port ${actualPort}: ${pid}`);
              log(`   To kill it, run: taskkill /PID ${pid} /F`);
            }
          }
        } catch {
          // Ignore errors
        }
      }
      
      log(`   Or use a different port: $env:PORT=${actualPort + 1}; npm run dev`);
      process.exit(1);
    } else {
      log(`❌ Server error: ${err.message}`);
      throw err;
    }
  });
  
  httpServer.listen(actualPort, host, () => {
    log(`✓ Server running at http://${host}:${actualPort}`);
    log(`✓ API endpoints available at http://${host}:${actualPort}/api`);
    if (process.env.NODE_ENV === "development") {
      log(`✓ Frontend dev server available at http://${host}:${actualPort}`);
      if (actualPort !== preferredPort) {
        log(`⚠️  Note: Server is running on port ${actualPort} instead of ${preferredPort}`);
      }
    }
  });
})();
