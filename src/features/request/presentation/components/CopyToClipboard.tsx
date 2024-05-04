import { toast } from "sonner";
import CopyToClipBoardIcon from "../../../../common/icons/CopyToClipboard";

export function CopyToClipBoard({
  url,
  props,
}: {
  url: string;
  props?: React.ComponentProps<"button">;
}) {
  return (
    <button
      {...props}
      className="  font-bold py-2 rounded"
      onClick={() => {
        navigator.clipboard.writeText(url);
        toast.success("Copied to clipboard");
      }}
    >
      <CopyToClipBoardIcon />
    </button>
  );
}