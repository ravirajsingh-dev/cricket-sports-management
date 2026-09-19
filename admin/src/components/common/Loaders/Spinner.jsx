import BouncingLoader from "./BouncingLoader";

/**
 * Full-viewport / page auth loading — uses BouncingLoader (no ring spinner).
 */
const Spinner = ({ fullViewport = false }) => (
  <BouncingLoader
    className={fullViewport ? "bouncing-loader-container--full-viewport" : ""}
    minHeight={fullViewport ? "100vh" : undefined}
  />
);

export default Spinner;
