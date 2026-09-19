import PropTypes from "prop-types";

/**
 * Full-area bouncing loader.
 * `minHeight` sets CSS `--loader-min-height` (any valid CSS length).
 */
const BouncingLoader = ({
  className = "",
  message = "",
  minHeight,
}) => {
  const style = minHeight
    ? { ["--loader-min-height"]: minHeight }
    : undefined;

  return (
    <div
      className={`bouncing-loader-container ${className}`.trim()}
      style={style}
    >
      <div className="bouncing-loader-wrapper">
        <div className="bouncing-loader">
          <div />
          <div />
          <div />
        </div>

        {message ? (
          <p
            className="bouncing-loader-message"
            role="status"
            aria-live="polite"
          >
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
};

BouncingLoader.propTypes = {
  className: PropTypes.string,
  message: PropTypes.string,
  minHeight: PropTypes.string,
};

export default BouncingLoader;
