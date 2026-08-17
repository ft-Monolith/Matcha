export interface PictureEntity {
  id: string;
  user_id: string;
  filename: string;
  is_profile: boolean;
  position: number;
  created_at: Date;
}
