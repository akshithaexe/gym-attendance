/**
 * TypeScript interfaces used across the frontend application.
 */

export type UserRole = "ADMIN" | "TRAINER" | "CUSTOMER";

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  trainer_id: number | null;
  membership_type: string | null;
  membership_expires_at: string | null;
}

export interface AttendanceRecord {
  id: number;
  user_id: number;
  user_name: string | null;
  user_email: string | null;
  check_in: string;
  check_out: string | null;
  marked_by: "qr_scan" | "manual";
  marked_by_user_id: number | null;
}

export interface TokenPayload {
  sub: string;
  role: UserRole;
  jti: string;
  exp: number;
  type?: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
}

export interface AttendanceListResponse {
  records: AttendanceRecord[];
  total: number;
}

export interface UserListResponse {
  users: User[];
  total: number;
}

export interface QRTokenResponse {
  qr_token: string;
}

export interface VerifyResponse {
  user_id: number;
  full_name: string;
  email: string;
  message: string;
}
