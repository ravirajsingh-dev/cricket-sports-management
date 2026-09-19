import PropTypes from "prop-types";
import BouncingLoader from "./BouncingLoader";

/**
 * Legacy spinner API — renders BouncingLoader so admin stays consistent.
 */
const CommonSpinner = ({ className = "", size = "md", message = "" }) => {
  const minHeightBySize = {
    sm: "2.5rem",
    md: "4rem",
    lg: "6rem",
  };

  return (
    <BouncingLoader
      className={`bouncing-loader-container--compact ${className}`.trim()}
      message={message}
      minHeight={minHeightBySize[size] || minHeightBySize.md}
    />
  );
};

CommonSpinner.propTypes = {
  className: PropTypes.string,
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  message: PropTypes.string,
};

export default CommonSpinner;
