import PropTypes from "prop-types";

/**
 * Single input-height shimmer bar (table skeleton style).
 */
const FormFieldSkeleton = ({ height = "field", className = "" }) => {
  const sizeClass =
    height === "textarea"
      ? "form-field-skeleton__bar--textarea"
      : "form-field-skeleton__bar--field";

  return (
    <div
      className={`form-field-skeleton placeholder-glow ${className}`.trim()}
      aria-busy="true"
      aria-live="polite"
    >
      <span className={`placeholder form-field-skeleton__bar ${sizeClass}`} />
    </div>
  );
};

FormFieldSkeleton.propTypes = {
  height: PropTypes.oneOf(["field", "textarea"]),
  className: PropTypes.string,
};

export default FormFieldSkeleton;
