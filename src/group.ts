import { DEFAULT_GROUP_SIZE } from "./constants";
import { UserRecord } from "./types";

// =============================================================================
// Public API
// =============================================================================

export const generateTopicUserGroups = (
  userList: any[]
) => {
  const shuffledUserList = shuffleUsers(userList);
  return distributeUsers(shuffledUserList);
};

// =============================================================================
// Private helpers
// =============================================================================

/**
 * Shuffle groups inside the list using pseudo-randomness.
 *
 * @todo Add cryptographically "true" randomness to make this production-ready.
 */
const shuffleUsers = (userList: UserRecord[]) => {
  return [...userList].sort(_ => 0.5 - Math.random());
};

const distributeUsers = (userList: UserRecord[]) => {
  const totalGroupCount = Math.ceil(userList.length / DEFAULT_GROUP_SIZE);
  const groupList: UserRecord[][] =
    new Array(totalGroupCount).fill(null).map(_ => []);

  for (const user of userList) {
    for (let i = 0; i < groupList.length; i += 1) {
      const group = groupList[i];

      const isGroupFull = group.length >= DEFAULT_GROUP_SIZE;

      if (!isGroupFull) {
        group.push(user);
        break;
      }
    }
  }

  return groupList;
};
