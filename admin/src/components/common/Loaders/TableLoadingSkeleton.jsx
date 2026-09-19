import PropTypes from "prop-types";

/**
 * Themed table loading skeleton — bars use .placeholder (tokens in variables.scss).
 */
const TableLoadingSkeleton = ({ rows = 5, columns = 5, label = "Loading" }) => (
  <div
    className="table-loading-skeleton placeholder-glow"
    role="status"
    aria-label={label}
  >
    {Array.from({ length: rows }, (_, row) => (
      <div
        key={`r-${row}`}
        className={`table-loading-skeleton__row${row % 2 ? " table-loading-skeleton__row--alt" : ""}`}
        aria-hidden="true"
      >
        {Array.from({ length: columns }, (_, col) => (
          <span
            key={`c-${row}-${col}`}
            className="placeholder table-loading-skeleton__bar"
          />
        ))}
      </div>
    ))}
  </div>
);

TableLoadingSkeleton.propTypes = {
  rows: PropTypes.number,
  columns: PropTypes.number,
  label: PropTypes.string,
};

export default TableLoadingSkeleton;
