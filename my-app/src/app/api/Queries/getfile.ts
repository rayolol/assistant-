import { useQuery } from "@tanstack/react-query";
import { getFile } from "@/app/api/api";
import { FileAttachment } from "@/app/types/schemas";

export const useGetFile = (fileId: string | null) => {
    return useQuery<FileAttachment, Error>({
        queryKey: ['file', fileId],
        queryFn: () => getFile(fileId),
        enabled: !!fileId,
        staleTime: 1000 * 60 * 5,
        retry: 3,
        retryDelay: 1000,
        onError: (error: Error) => {
            console.error("Error getting file:", error);
        },
        onSuccess: (data: FileAttachment) => {
            console.log("File fetched successfully:", data);
        },
    })
}