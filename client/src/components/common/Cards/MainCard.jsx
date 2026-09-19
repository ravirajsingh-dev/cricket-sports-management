import PropTypes from "prop-types";

/**
 * Form card wrapper — title + body using common-form-card styles.
 */
const MainCard = ({
  title,
  header,
  children,
  className = "",
  bodyClassName = "",
}) => {
  const cardClassName = ["common-form-card", className].filter(Boolean).join(" ");

  return (
    <div className={cardClassName}>
      {title ? <h5 className="custom-heading-theam mb-0">{title}</h5> : null}
      {header}
      <div className={bodyClassName || undefined}>{children}</div>
    </div>
  );
};

MainCard.propTypes = {
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  header: PropTypes.node,
  children: PropTypes.node,
  className: PropTypes.string,
  bodyClassName: PropTypes.string,
};

export default MainCard;
