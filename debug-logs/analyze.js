#!/usr/bin/env node

import fs from "fs";
import path from "path";

const DEBUG_LOGS_DIR = path.join(process.cwd(), "debug-logs");

interface DebugLog {
  timestamp: string;
  listId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
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
  durationMs: number;
  error?: string;
}

function analyzeDebugLogs() {
  if (!fs.existsSync(DEBUG_LOGS_DIR)) {
    console.log("❌ No debug logs found. Upload some files first!");
    return;
  }

  const files = fs.readdirSync(DEBUG_LOGS_DIR).filter((f) => f.endsWith(".json"));

  if (files.length === 0) {
    console.log("❌ No debug logs found");
    return;
  }

  console.log("\n📊 DEBUG LOG ANALYSIS\n");
  console.log(`Found ${files.length} log files\n`);

  let totalUploadTime = 0;
  let successCount = 0;
  let errorCount = 0;
  const stats = {
    totalNew: 0,
    totalUpdates: 0,
    totalDuration: 0,
  };

  files.forEach((file) => {
    const filepath = path.join(DEBUG_LOGS_DIR, file);
    const content = fs.readFileSync(filepath, "utf-8");
    const log: DebugLog = JSON.parse(content);

    if (log.error) {
      errorCount++;
      console.log(`❌ ${file}`);
      console.log(`   Error: ${log.error}\n`);
      return;
    }

    successCount++;
    const { newItemsCount, updatesCount, message } = log.finalResult;
    stats.totalNew += newItemsCount;
    stats.totalUpdates += updatesCount;
    stats.totalDuration += log.durationMs;

    console.log(`✅ ${log.fileName}`);
    console.log(`   File Type: ${log.fileType} (${log.fileSize} bytes)`);
    console.log(`   Result: ${message}`);
    console.log(`   Duration: ${log.durationMs}ms`);

    if (log.aiResponse && log.aiResponse.length > 200) {
      console.log(
        `   AI Response: ${log.aiResponse.substring(0, 100)}...`
      );
    }

    console.log();
  });

  console.log("📈 SUMMARY\n");
  console.log(`✅ Successful uploads: ${successCount}`);
  console.log(`❌ Failed uploads: ${errorCount}`);
  console.log(`Total new items: ${stats.totalNew}`);
  console.log(`Total updated items: ${stats.totalUpdates}`);
  console.log(
    `Average upload time: ${Math.round(stats.totalDuration / successCount)}ms\n`
  );
}

analyzeDebugLogs();
