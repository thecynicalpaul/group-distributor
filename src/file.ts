import fs from "fs";
import path from "path";
import { parse } from "csv-parse";

import type { UserRecord } from "./types";

// =============================================================================
// Public API
// =============================================================================

/**
 * Read the contents of a CSV file residing at a specified filepath.
 *
 * @todo add proper structure type.
 *
 * @param filepath - Relative or absolute path of the CSV file.
 * @returns File contents in the form of object literals inside of an array.
 */
export const asyncLoadCsvFileData = async (filepath: string) => {
  try {
    const recordList: UserRecord[] = [];

    const fullPath = path.join(process.cwd(), filepath);
    // We do not need to destroy this, as this is done automatically upon GC.
    const readStream = fs.createReadStream(fullPath);
    // Eliminate improper data rows
    const csvParser = readStream.pipe(parse({
      columns: true,
      skip_empty_lines: true,
      skip_records_with_empty_values: true,
      skip_records_with_error: true
    }));

    for await (const record of csvParser) {
      recordList.push(record);
    }

    return recordList;
  } catch (error: unknown) {
    console.error("**Err: Failed to read CSV file");
    throw error;
  }
};
