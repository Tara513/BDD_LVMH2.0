export type UserRole = "admin" | "analyst" | "seller";

export type UserProfile = {
  id: string;
  role: UserRole;
  house_id?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type UserSessionData = {
  userId: string;
  role: UserRole;
  houseId?: string | null;
};
