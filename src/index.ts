import { DEFAULT_TOPIC_COUNT } from "./constants";
import { asyncLoadCsvFileData } from "./file";
import { generateTopicUserGroups } from "./group";

import type { UserRecord } from "./types";

/**
 * Main executor of the program. Will crash the process on error.
 *
 * @todo: Add CLI arguments, add support for group weights.
 */
const main = async () => {
  console.log("Hello world!");
  const userList = await asyncLoadCsvFileData("./priv/people.csv");

  const topicList: UserRecord[][][] = [];
  for (let i = 0; i < DEFAULT_TOPIC_COUNT; i += 1) {
    const groupList = generateTopicUserGroups(userList, {
      prevGroupList: topicList[i - 1],
      depOverlap: "max",
      levelOverlap: "max"
    });
    topicList.push(groupList);
  }

  console.log(topicList.map(gl => gl.map(ul => ul.map(u => [u.id, u.department, u.level].toString()))));
};

// =============================================================================
// Private helpers
// =============================================================================




// =============================================================================
// Exec
// =============================================================================

await main();
