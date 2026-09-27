export type Playlist = {
  id: string;
  title: string;
  description: string | null;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  createdAt: Date;
  createdBy: string;
  createdByName: string;
  updatedBy: string | null;
  updatedAt: Date | null;
};

export type PlaylistWithStats = Playlist & {
  songCount: number;
  totalDurationSeconds: number;
};

export type PlaylistSongEntry = {
  songId: string;
  title: string;
  artist: string | null;
  position: number;
};

export type PlaylistSummary = {
  id: string;
  title: string;
};
