import fs from "fs";
import path from "path";
import { parse, Parser } from "csv-parse";

import type { Group, UserRecord } from "./types";

// =============================================================================
// Public API
// =============================================================================

/**
 * Read the contents of a CSV file residing at a specified filepath.
 *
 * @param filepath - Relative or absolute path of the CSV file.
 * @returns File contents in the form of object literals inside of an array.
 */
export const asyncLoadCsvFileData = async (filepath: string) => {
  let csvParser: Parser | null = null;
  try {
    const recordList: UserRecord[] = [];

    const fullPath = path.join(process.cwd(), filepath);
    // We do not need to destroy this, as this is done automatically upon GC.
    const readStream = fs.createReadStream(fullPath);
    // Eliminate improper data rows
    csvParser = readStream.pipe(parse({
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
  } finally {
    csvParser?.end();
  }
};

/**
 * Create a CSV file containing the generate group data and write it at the
 * specified path.
 */
export const asyncWriteToCsvFile = async (
  userList: UserRecord[],
  topicList: Group[][],
  filePath: string
) => {
  // Prepare CSV columns
  const topicCount = topicList.length;
  const columnList = ["userId"];

  for (let i = 1; i <= topicCount; i += 1) {
    columnList.push(`sessionId for topic ${i}`);
  }

  // Generate cache of pairing users to groups in each topic for easier
  // transformation
  const userCacheList: Map<UserRecord, string>[] =
    new Array(topicCount).fill(null).map(_ => new Map());
  for (let i = 0; i < topicCount; i += 1) {
    const groupList = topicList[i];

    for (let j = 0; j < groupList.length; j += 1) {
      const group = groupList[j];

      for (const user of group) {
        userCacheList[i].set(user, `${j + 1}`);
      }
    }
  }

  // Retriece cached data and join into a string
  let outContent = `${columnList.join(", ")}\n`;
  for (const user of userList) {
    const rowData = [user.id];
    for (const cache of userCacheList) {
      const groupId = cache.get(user);
      rowData.push(groupId || "");
    }

    outContent = outContent.concat(rowData.join(", "), "\n");
  }

  // Write the string content to a file
  const fullPath = path.join(process.cwd(), filePath);
  try {
    await fs.promises.writeFile(fullPath, outContent, "utf-8");
  } catch (error: unknown) {
    console.error("**Err: Failed to write to file.");
    throw error;
  }
};
