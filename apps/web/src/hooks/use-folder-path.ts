import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import {
  getFolderPathQueryKey,
  getFolderQueryOptions,
  type Folder,
} from "@/services/resources/file";

export function useFolderPath(opts: { folderId: string | null; organizationId: string }): Folder[] {
  const queryClient = useQueryClient();

  const { data } = useSuspenseQuery({
    queryKey: getFolderPathQueryKey(opts),
    queryFn: async () => {
      const path: Folder[] = [];
      let currentId = opts.folderId;
      while (currentId) {
        const folder = await queryClient.fetchQuery(
          getFolderQueryOptions({ id: currentId, organizationId: opts.organizationId }),
        );
        path.unshift(folder);
        currentId = folder.parentFolderId;
      }
      return path;
    },
  });

  return data;
}
