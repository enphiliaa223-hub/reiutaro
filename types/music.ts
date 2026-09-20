export interface MusicTrack {
  id: string;
  title: string;
  artist?: string | null;
  src: string;
  cover?: string | null;
}
