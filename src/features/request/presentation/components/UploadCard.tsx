import { Avatar, AvatarFallback } from "@radix-ui/react-avatar";
import { DownloadIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { UserUpload } from "../../domain/entities/request-types";

export function UploadCard({ upload }: { upload: UserUpload }) {
  console.log({ upload });
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
      <Avatar>
        <AvatarFallback>
          {upload.fileSenderData?.senderName?.charAt(0) || "A"}
        </AvatarFallback>
      </Avatar>
      <div>
        <p className="font-medium">
          {upload.fileSenderData?.senderName || "Anonymous"}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Uploaded {upload.fileSenderData?.uploadDate || "a few seconds ago"}
        </p>
      </div>
      <Link href={upload.fileUrl}>
        <DownloadIcon className="h-4 w-4" />
        <span className="sr-only">Download </span>
      </Link>
    </div>
  );
}
