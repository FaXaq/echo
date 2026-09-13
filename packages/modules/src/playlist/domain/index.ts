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

export type PlaylistSongEntry = {
  songId: string;
  title: string;
  artist: string | null;
};

export type PlaylistSummary = {
  id: string;
  title: string;
};
