"use client";

import FolderIcon from "@/common/icons/FolderIcon";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import { File } from "./File";
import { useEffect, useState } from "react";
import SubFolder from "./SubFolder";
import { usePathname, useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";

export type TreeFile = {
  name: string;
  fullPath: string;
  url?: string;
  size?: number;
  parent: {
    name: string;
    fullPath: string;
  };
};

export type SubFolder = {
  name: string;
  fullPath: string;
};

export type RootFolder = {
  name: string;
  files: TreeFile[];
  folders: SubFolder[];
};

export type FolderProps = {
  props: RootFolder;
};

export function Folder({ props }: FolderProps) {
  const { files, name, folders } = props;
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(() => searchParams.get(name) === "true");
  const router = useRouter();
  const pathName = usePathname();
  
  useEffect(() => {
   const isInUrl = searchParams.has(name);
    if (!isInUrl) {
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.set(name, open.toString());
      router.replace(`${pathName}?${newParams.toString()}`);
    }
    
  }, []);

  function handleToggle() {
    const isOpen = searchParams.get(name) === "true";
    setOpen(!isOpen);

    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set(name, (!isOpen).toString());
    console.log({ paramsString: newParams.toString() });
    router.replace(`
      ${pathName}?${newParams.toString()}`);
  }

  return (
    <>
      <div
        className="group flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors duration-200 cursor-pointer"
        onClick={handleToggle}
      >
        <div className="flex items-center space-x-2">
          <FolderIcon className="w-5 h-5 text-yellow-500 group-hover:text-yellow-600 dark:text-yellow-400 dark:group-hover:text-yellow-500" />
          <span className="font-medium text-gray-900 dark:text-gray-50">
            {name}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-gray-500 text-sm dark:text-gray-400">
            {files.length} items
          </span>
          <button className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50 focus:outline-none">
            {open ? (
              <ChevronDownIcon className="w-5 h-5" />
            ) : (
              <ChevronDownIcon className="w-5 h-5" />
            )}
            <span className="sr-only">Toggle folder</span>
          </button>
        </div>
      </div>
      {open && (
        <>
          {folders.map((folder, index) => {
            return (
              <SubFolder
                key={index}
                name={folder.name}
                fullPath={folder.fullPath}
              />
            );
          })}
          {files.map((file, index) => {
            return <File key={index} file={file} />;
          })}
        </>
      )}
    </>
  );
}
