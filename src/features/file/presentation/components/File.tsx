import { FileIcon } from "@radix-ui/react-icons";
import { RootFolder } from "./Folder";
import { formatDate } from "@/common/utils/date-format";
import { convertKbToMb } from "@/common/utils/from-kb-to-mb";
import { convertMimeTypeToDescription } from "@/common/utils/content-type";
import { redirect } from "next/navigation";
import Link from "next/link";
import PaperclipIcon from "@/common/icons/PaperClipIcon";
import DeleteIcon from "@/common/icons/DeleteIcon";

export type FileProps = {
  file: RootFolder["files"][number];
};

export function File({ file }: FileProps) {
  return (
    <div className="pl-8 space-y-2 ">
      {/* Files in Documents folder */}
      <div className="sm:flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors duration-200 cursor-pointer">
        <div className="flex items-center space-x-2">
          <FileIcon className="w-5 h-5 text-blue-500 group-hover:text-blue-600 dark:text-blue-400 dark:group-hover:text-blue-500" />
          <Link
            href={file.url ?? "/"}
            className="font-medium text-gray-900 dark:text-gray-50"
          >
            {file.name.slice(0, 20)}
          </Link>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-gray-500 text-sm dark:text-gray-400">
            {convertMimeTypeToDescription(file.metadata?.contentType ?? "")}
          </span>
          <span className="text-gray-500 text-sm dark:text-gray-400">
            {convertKbToMb(file.metadata?.size ?? 0)}
          </span>
          <span className="text-gray-500 text-sm dark:text-gray-400">
            {formatDate({
              date: file.metadata?.timeCreated ?? "",
              showDaysAgo: true,
            })}
          </span>
          <span className="text-gray-500 text-sm dark:text-gray-400 ">
            <DeleteIcon />
          </span>
        </div>
      </div>
    </div>
  );
}
