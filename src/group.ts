import { DEFAULT_GROUP_SIZE } from "./constants";
import { UserRecord } from "./types";

type Group = UserRecord[];
type TopicCache = Map<UserRecord, Set<UserRecord>>;
type DepCache = Map<Group, Set<string>>;
type LevelCache = Map<Group, Set<string>>;

// =============================================================================
// Public API
// =============================================================================

interface GenerateTopicUserGroupsOptions {
  /** Set this if we want to prevent overlap. */
  prevGroupList?: Group[];
  depOverlap?: "max" | "min";
  levelOverlap?: "max" | "min";
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
    prevGroupList = [],
    depOverlap,
    levelOverlap
  }: GenerateTopicUserGroupsOptions
) => {
  const totalGroupCount = Math.ceil(userList.length / DEFAULT_GROUP_SIZE);
  const groupList: Group[] =
    new Array(totalGroupCount).fill(null).map(_ => []);

  const topicCache = generateTopicCache(prevGroupList);
  const depCache: DepCache = new Map();
  const levelCache: LevelCache = new Map();

  for (const user of userList) {
    let hasGroup = false;

    for (let i = 0; i < groupList.length; i += 1) {
      const group = groupList[i];

      const isGroupFull =
        group.length >= DEFAULT_GROUP_SIZE;
      const isOverlapping =
        isTopicUserOverlapping(topicCache, group, user);
      const isDepMatch =
        isUserDepOptimized(depOverlap, depCache, group, user);
      const isLevelMatch =
        isUserLevelOptimized(levelOverlap, levelCache, group, user);

      const canAddToGroup =
        !(isGroupFull || isOverlapping || !isDepMatch || !isLevelMatch);

      if (canAddToGroup) {
        group.push(user);
        hasGroup = true;

        depOverlap && addToGroupCache(depCache, group, user, "department");
        levelOverlap && addToGroupCache(levelCache, group, user, "level");

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

          depOverlap && addToGroupCache(depCache, group, user, "department");
          levelOverlap && addToGroupCache(levelCache, group, user, "level");

          break;
        }
      }
    }
  }

  console.log(levelCache);

  return groupList;
};

const generateTopicCache = (groupList: Group[]) => {
  const topicCache: Map<UserRecord, Set<UserRecord>> = new Map();
  for (let i = 0; i < groupList.length; i += 1) {
    const group = groupList[i];

    for (let j = 0; j < group.length; j += 1) {
      const user = group[j];
      topicCache.set(user, new Set(group));
      topicCache.get(user)?.delete(user);
    }
  }

  return topicCache;
};

const isTopicUserOverlapping = (
  topicCache: TopicCache,
  group: Group,
  user: UserRecord
) => {
  const userOverlap = topicCache.get(user);
  return group.some(groupUser => Boolean(userOverlap?.has(groupUser)));
};

const isUserDepOptimized = (
  type: "min" | "max" | undefined,
  cache: DepCache,
  group: Group,
  user: UserRecord
) => {
  return isGroupCacheOptimized(type, cache, group, user, "department");
};

const isUserLevelOptimized = (
  type: "min" | "max" | undefined,
  cache: LevelCache,
  group: Group,
  user: UserRecord
) => {
  return isGroupCacheOptimized(type, cache, group, user, "level");
};


const isGroupCacheOptimized = (
  type: "min" | "max" | undefined,
  cache: LevelCache,
  group: Group,
  user: UserRecord,
  property: keyof UserRecord
) => {
  if (!type) { return true; }

  const cacheEntry = cache.get(group);
  if (!cacheEntry) { return true; }

  const hasAlikes = Boolean(cacheEntry.has(user[property]));

  if (type === "max") {
    return hasAlikes;
  }

  return !hasAlikes;
};

const addToGroupCache = (
  cache: DepCache | LevelCache,
  group: Group,
  user: UserRecord,
  property: keyof UserRecord
) => {
  const value = user[property];
  if (!value) { return; }

  // console.log(user, value)

  cache.set(group, new Set(
    [...(cache.get(group) || []), value])
  );
};
