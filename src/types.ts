export interface UserRecord {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  level: string;
}

export type Group = UserRecord[];
