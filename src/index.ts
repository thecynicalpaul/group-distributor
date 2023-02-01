import { Command, Option } from "@commander-js/extra-typings";
import { DEFAULT_GROUP_SIZE, DEFAULT_TOPIC_COUNT } from "./constants";
import { asyncLoadCsvFileData, asyncWriteToCsvFile } from "./file";
import { generateTopicUserGroups } from "./group";

import type { Group } from "./types";

const program = new Command()
  .description("Create groups of n participants from a CSV file for multiple sessions.")
  .name("npm start --")
  .showHelpAfterError()
  .argument("<input-file>", "location of the source CSV file")
  .argument("<output-file>", "location of the resulting CSV file")
  .addOption(new Option("-g, --group <size>", "number of users in a group").default(DEFAULT_GROUP_SIZE))
  .addOption(new Option("-t, --topics <count>", "number of topics").default(DEFAULT_TOPIC_COUNT))
  .option("-o, --overlap", "minimize group overlap across topics")
  .addOption(new Option("-l, --level <overlap>", "department overlap").choices(["max", "min"]))
  .addOption(new Option("-d, --department <overlap>", "level overlap").choices(["max", "min"]))
  .option("--verbose", "output debug messages")
  ;

program.parse();

const [
  inputFilePath,
  outputFilePath
] = program.processedArgs;
const {
  group: groupOption,
  topics: topicOption,
  overlap: overlapOption = false,
  level: levelOption,
  department: departmentOption,
  verbose: verboseOption = false
} = program.opts();

/**
 * Main executor of the program. Will crash the process on error.
 *
 * @todo: Add CLI arguments, add support for group weights.
 */
const main = async () => {
  // Sanitize arguments
  const groupSize = typeof groupOption === "number"
    ? groupOption
    : parseInt(groupOption);
  const topicCount = typeof topicOption === "number"
    ? topicOption
    : parseInt(topicOption);

  // Read input file content and parse it
  const userList = await asyncLoadCsvFileData(inputFilePath);

  // Get the main procedure going
  const topicList: Group[][] = [];
  for (let i = 0; i < topicCount; i += 1) {
    const groupList = generateTopicUserGroups(userList, {
      groupSize: groupSize,
      prevGroupList: overlapOption
        ? topicList[i - 1]
        : undefined,
      depOverlap: departmentOption as any,
      levelOverlap: levelOption as any
    });
    topicList.push(groupList);
  }

  if (verboseOption) {
    console.debug(
      topicList.map(
        gl => gl.map(
          ul => ul.map(u => [u.id, u.department, u.level].toString())
        )
      ));
  }

  await asyncWriteToCsvFile(userList, topicList, outputFilePath);
};

// =============================================================================
// Exec
// =============================================================================

await main();
