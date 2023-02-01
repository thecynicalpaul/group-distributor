import { asyncLoadCsvFileData } from "./file";

import type { UserRecord } from "./types";

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




// =============================================================================
// Exec
// =============================================================================

await main();
