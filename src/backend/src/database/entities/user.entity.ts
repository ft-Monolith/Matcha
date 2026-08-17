export interface UserEntity {
  id: string;
  email: string;
  username: string;
  last_name: string;
  first_name: string;
  password_hash: string;
  email_verified: boolean;
  onboarded: boolean;
  created_at: Date;
  updated_at: Date;
}
