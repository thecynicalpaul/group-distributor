import { parse } from "csv-parse";

import fs from "fs";
import path from "path";

/**
 * Main executor of the program. Will crash the process on error.
 *
 * @todo: Add CLI arguments, add support for group weights.
 */
const main = async () => {
  console.log("Hello world!");
  const userList = await asyncLoadCsvFileData("./priv/people.csv");
  console.log(userList);
};

// =============================================================================
// Private helpers
// =============================================================================

/**
 * Read the contents of a CSV file residing at a specified filepath.
 *
 * @todo add proper structure type.
 *
 * @param filepath - Relative or absolute path of the CSV file.
 * @returns File contents in the form of object literals inside of an array.
 */
const asyncLoadCsvFileData = async (filepath: string) => {
  try {
    const recordList: any[] = [];

    const fullPath = path.join(process.cwd(), filepath);
    // We do not need to destroy this, as this is done automatically upon GC.
    const readStream = fs.createReadStream(fullPath);
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


// =============================================================================
// Exec
// =============================================================================

await main();
