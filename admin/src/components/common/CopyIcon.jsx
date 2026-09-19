import { MdOutlineCopyAll } from "react-icons/md";

/**
 * Copy button — copies `textToCopy` to clipboard (Member ID: pass digits only).
 */
const CopyIcon = ({ textToCopy, iconSize = 18, className = "", onCopy, title = "Copy" }) => {
  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(String(textToCopy));
      if (typeof onCopy === "function") onCopy();
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <button
      type="button"
      className={`btn btn-link p-0 border-0 shadow-none ${className}`.trim()}
      onClick={handleClick}
      title={title}
      aria-label={title}
      disabled={!textToCopy}
    >
      <MdOutlineCopyAll className="copy-action-icon" size={iconSize} />
    </button>
  );
};

export default CopyIcon;
