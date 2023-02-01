import { DEFAULT_GROUP_SIZE } from "./constants";
import { UserRecord } from "./types";

type Group = UserRecord[];

// =============================================================================
// Public API
// =============================================================================

interface GenerateTopicUserGroupsOptions {
  /** Set this if we want to prevent overlap. */
  prevGroupList?: Group[];
}

export const generateTopicUserGroups = (
  userList: UserRecord[],
  options: GenerateTopicUserGroupsOptions = {}
) => {
  // const shuffledUserList = shuffleUsers(userList);
  return distributeUsers(userList, options);
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

const distributeUsers = (
  userList: UserRecord[],
  {
    prevGroupList = []
  }: GenerateTopicUserGroupsOptions
) => {
  const totalGroupCount = Math.ceil(userList.length / DEFAULT_GROUP_SIZE);
  const groupList: Group[] =
    new Array(totalGroupCount).fill(null).map(_ => []);

  const topicCache: Map<UserRecord, Set<UserRecord>> = new Map();
  for (let i = 0; i < prevGroupList.length; i += 1) {
    const group = prevGroupList[i];

    for (let j = 0; j < group.length; j += 1) {
      const user = group[j];
      topicCache.set(user, new Set(group));
      topicCache.get(user)?.delete(user);
    }
  }

  for (const user of userList) {
    let hasGroup = false;

    for (let i = 0; i < groupList.length; i += 1) {
      const group = groupList[i];

      const isGroupFull = group.length >= DEFAULT_GROUP_SIZE;

      const userOverlap = topicCache.get(user);
      const isOverlapping =
        group.some(groupUser => Boolean(userOverlap?.has(groupUser)));

      // TODO: figured out a way to filter users that don't match arg criteria
      if (!isGroupFull && !isOverlapping) {
        group.push(user);
        hasGroup = true;
        // If the currently iterated user added to the group, stop cycling
        // through the groups.
        // Feels illegal, but building an escape hatch around this single line
        // isn't worth our time.
        break;
      }


    }

    if (!hasGroup) {
      // Naiively cleanup any left out users into the last free group. Since users
      // are shuffled every iteration, the chances of this group being
      // suboptimal are arbitrarily less.
      for (let i = groupList.length - 1; i >= 0; i -= 1) {
        const group = groupList[i];
        const isGroupFull = group.length >= DEFAULT_GROUP_SIZE;
        if (!isGroupFull) {
          group.push(user);
          break;
        }
      }
    }
  }

  return groupList;
};
