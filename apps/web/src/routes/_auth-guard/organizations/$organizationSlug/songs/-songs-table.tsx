import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/table";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@echo/api/router";

type RouterOutput = inferRouterOutputs<AppRouter>;
type SongListItem = RouterOutput["organization"]["song"]["list"][number];

interface SongsTableProps {
  songs: SongListItem[];
  organizationSlug: string;
  onRefresh: () => void;
}

export function SongsTable({ songs, organizationSlug }: SongsTableProps) {
  const { t } = useTranslation("songs");

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("Name")}</TableHead>
          <TableHead>{t("BPM")}</TableHead>
          <TableHead>{t("Created at")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {songs.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={3}
              className="text-center py-8 text-muted-foreground"
            >
              {t("No songs yet")}
            </TableCell>
          </TableRow>
        ) : (
          songs.map((song) => (
            <TableRow key={song.id}>
              <TableCell>
                <Link
                  to="/organizations/$organizationSlug/songs/$songSlug"
                  params={{ organizationSlug, songSlug: song.id }}
                  className="hover:underline font-medium"
                >
                  {song.name}
                </Link>
              </TableCell>
              <TableCell>{song.bpm ?? "—"}</TableCell>
              <TableCell>
                {new Date(song.createdAt).toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
