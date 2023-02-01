import { UserRecord } from "./types";

type Group = UserRecord[];
type TopicCache = Map<UserRecord, Set<UserRecord>>;
type DepCache = Map<Group, Set<string>>;
type LevelCache = Map<Group, Set<string>>;

// =============================================================================
// Public API
// =============================================================================

interface GenerateTopicUserGroupsOptions {
  groupSize: number;
  /** Set this if we want to prevent overlap. */
  prevGroupList?: Group[];
  depOverlap?: "max" | "min";
  levelOverlap?: "max" | "min";
}

export const generateTopicUserGroups = (
  userList: UserRecord[],
  options: GenerateTopicUserGroupsOptions
) => {
  const shuffledUserList = shuffleUsers(userList);
  return distributeUsers(shuffledUserList, options);
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

/**
 * Core utility responsible for distributing users among the groups. Operates
 * on the assumption that all overlap requirements are of equal weight.
 * Greedily scans through each user allocating to the best fitting group, and if
 * none found, then the closest non-full one.
 */
const distributeUsers = (
  userList: UserRecord[],
  {
    groupSize,
    prevGroupList = [],
    depOverlap,
    levelOverlap
  }: GenerateTopicUserGroupsOptions
) => {
  // Populate the group list with empty groups to allow simpler travel.
  const totalGroupCount = Math.ceil(userList.length / groupSize);
  const groupList: Group[] =
    new Array(totalGroupCount).fill(null).map(_ => []);

  // Prepare caches
  const topicCache = generateTopicCache(prevGroupList);
  const depCache: DepCache = new Map();
  const levelCache: LevelCache = new Map();

  for (const user of userList) {
    let hasGroup = false;

    for (let i = 0; i < groupList.length; i += 1) {
      const group = groupList[i];

      // Identify whether this group is the best fit for the user
      const isGroupFull =
        group.length >= groupSize;
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
      // Naiively cleanup any left out users into the last free group.
      // Since users are shuffled every iteration, the chances of this group
      // being suboptimal are arbitrarily less. The direction of operation
      // seems to not have much impact so far...
      for (let i = groupList.length - 1; i >= 0; i -= 1) {
        const group = groupList[i];
        const isGroupFull = group.length >= groupSize;
        // If the group isn't full, place the user there
        if (!isGroupFull) {
          group.push(user);

          break;
        }
      }
    }
  }

  return groupList;
};

/**
 * Generate a cache of user distribution from the previous topic iteration.
 * This is useful for preventing the same users from regrouping again, to the
 * best of this algorithm's ability.
 */
const generateTopicCache = (groupList: Group[]) => {
  const topicCache: Map<UserRecord, Set<UserRecord>> = new Map();
  for (let i = 0; i < groupList.length; i += 1) {
    const group = groupList[i];

    for (let j = 0; j < group.length; j += 1) {
      const user = group[j];
      // Add all users of the group except itself.
      topicCache.set(user, new Set(group));
      topicCache.get(user)?.delete(user);
    }
  }

  return topicCache;
};

/**
 * Utility to determine whether the user was with any of the other users
 * In the previous topic.
 */
const isTopicUserOverlapping = (
  topicCache: TopicCache,
  group: Group,
  user: UserRecord
) => {
  const userOverlap = topicCache.get(user);
  return group.some(groupUser => Boolean(userOverlap?.has(groupUser)));
};

/**
 * Utility to determine whether the user is in the best group based on the
 * configured department optimization.
 */
const isUserDepOptimized = (
  type: "min" | "max" | undefined,
  cache: DepCache,
  group: Group,
  user: UserRecord
) => {
  return isGroupCacheOptimized(type, cache, group, user, "department");
};

/**
 * Utility to determine whether the user is in the best group based on the
 * configured level optimization.
 */
const isUserLevelOptimized = (
  type: "min" | "max" | undefined,
  cache: LevelCache,
  group: Group,
  user: UserRecord
) => {
  return isGroupCacheOptimized(type, cache, group, user, "level");
};

/**
 * Helper carrying out cache validation for user fields, since the caches
 * act identically. (for now)
 */
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

/**
 * Update property-based cache with the user's value. Acts on the assumption
 * that the passed cache shares its behavior with the others.
 */
const addToGroupCache = (
  cache: DepCache | LevelCache,
  group: Group,
  user: UserRecord,
  property: keyof UserRecord
) => {
  const value = user[property];
  if (!value) { return; }

  cache.set(group, new Set(
    [...(cache.get(group) || []), value])
  );
};
