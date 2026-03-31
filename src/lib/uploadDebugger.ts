import fs from "fs";
import path from "path";

interface DebugLogEntry {
  timestamp: string;
  listId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  existingItems: Array<{ id: string; text: string; checked: boolean }>;
  aiPrompt: string;
  aiResponse: string;
  parsedResult: {
    new: string[];
    updates: Array<{ id: string; text: string }>;
  };
  finalResult: {
    newItemsCount: number;
    updatesCount: number;
    message: string;
  };
  error?: string;
  durationMs: number;
}

export class UploadDebugger {
  private logsDir: string;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.logsDir = path.join(process.cwd(), "debug-logs");
    
    // Only create logs directory in development
    if (this.isDevelopment) {
      this.ensureLogsDir();
    }
  }

  private ensureLogsDir() {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  public async logUpload(entry: DebugLogEntry) {
    // Only log in development environment
    if (!this.isDevelopment) {
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `upload_${timestamp}_${entry.fileName}.json`;
    const filepath = path.join(this.logsDir, filename);

    const logData = {
      ...entry,
      _meta: {
        loggedAt: new Date().toISOString(),
        version: "1.0.0",
      },
    };

    try {
      await fs.promises.writeFile(
        filepath,
        JSON.stringify(logData, null, 2),
        "utf-8"
      );
      console.log(`[DEBUG] Log saved to: ${filename}`);
    } catch (error) {
      console.error("[DEBUG] Failed to write log:", error);
    }
  }

  public async logError(
    fileName: string,
    error: Error,
    context: Record<string, any>
  ) {
    // Only log in development environment
    if (!this.isDevelopment) {
      // Still log errors to console in production for monitoring
      console.error(`[UPLOAD ERROR] ${fileName}:`, error.message);
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `error_${timestamp}_${fileName}.json`;
    const filepath = path.join(this.logsDir, filename);

    const logData = {
      timestamp: new Date().toISOString(),
      fileName,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      context,
    };

    try {
      await fs.promises.writeFile(
        filepath,
        JSON.stringify(logData, null, 2),
        "utf-8"
      );
      console.error(`[DEBUG] Error log saved to: ${filename}`);
    } catch (writeError) {
      console.error("[DEBUG] Failed to write error log:", writeError);
    }
  }
}
