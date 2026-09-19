import React, { useEffect, useMemo } from "react";
import { connect } from "react-redux";
import { Link } from "react-router";
import { Container } from "react-bootstrap";
import {
  FaUserCircle,
  FaCheckCircle,
  FaArrowRight,
} from "react-icons/fa";
import { loadUser } from "@src/features/auth";
import { setAlert } from "@src/app/state/actions/alert";
import BouncingLoader from "@src/components/common/Loaders/BouncingLoader";
import CopyIcon from "@src/components/common/CopyIcon";
import PortalItems from "@src/app/router/PortalItems";
import { getMemberIdPhonePart } from "@src/utils/memberIdFormatter";

const QUICK_ACTION_META = {
  "/user/my-account": {
    icon: FaUserCircle,
    description: "View and update your profile details",
  },
};

const Dashboard = ({
  loggedInUser,
  loadUser,
  setAlert,
  abbreviation,
}) => {
  useEffect(() => {
    if (!loggedInUser) {
      loadUser();
    }
  }, [loggedInUser, loadUser]);

  const quickActions = useMemo(
    () =>
      PortalItems.filter((item) => item.path !== "/user/dashboard").map(
        (item) => ({
          ...item,
          ...QUICK_ACTION_META[item.path],
        }),
      ),
    [],
  );

  const firstName = loggedInUser?.name?.trim().split(/\s+/)[0] || "Member";
  const isActive = loggedInUser?.status === 1;
  const memberIdDigits = getMemberIdPhonePart(
    loggedInUser?.memberId,
    abbreviation,
  );
  const playingRoleName = loggedInUser?.playingRole?.name || "";

  if (!loggedInUser) {
    return <BouncingLoader minHeight="420px" />;
  }

  return (
    <Container className="dashboard-page">
      <div className="dashboard-page__inner">
        <section className="dashboard-hero">
          <div className="dashboard-hero__atmosphere" aria-hidden />

          <p className="dashboard-hero__eyebrow">Member portal</p>

          <div className="dashboard-hero__greeting">
            <h1 className="dashboard-hero__title">
              Welcome back, <span className="dashboard-hero__name">{firstName}</span>
            </h1>
            {isActive && (
              <p className="dashboard-hero__status">
                <FaCheckCircle aria-hidden />
                <span>Active member</span>
              </p>
            )}
          </div>

          <dl className="dashboard-facts">
            {loggedInUser.memberId && (
              <div className="dashboard-facts__row">
                <dt>Member ID</dt>
                <dd>
                  <span className="dashboard-facts__value">
                    {loggedInUser.memberId}
                  </span>
                  {memberIdDigits && (
                    <CopyIcon
                      textToCopy={memberIdDigits}
                      iconSize={16}
                      className="dashboard-facts__copy"
                      onCopy={() =>
                        setAlert("Member ID copied to clipboard", "success")
                      }
                    />
                  )}
                </dd>
              </div>
            )}

            {loggedInUser.phone && (
              <div className="dashboard-facts__row">
                <dt>Phone</dt>
                <dd>
                  <span className="dashboard-facts__value">
                    {loggedInUser.phone}
                  </span>
                </dd>
              </div>
            )}

            {playingRoleName && (
              <div className="dashboard-facts__row">
                <dt>Role</dt>
                <dd>
                  <span className="dashboard-facts__value">
                    {playingRoleName}
                  </span>
                </dd>
              </div>
            )}
          </dl>
        </section>

        <section className="dashboard-quick">
          <header className="dashboard-quick__header">
            <h2 className="dashboard-quick__title">Quick actions</h2>
            <p className="dashboard-quick__subtitle">
              Jump to what you need next
            </p>
          </header>

          <nav className="dashboard-quick__nav" aria-label="Quick actions">
            {quickActions.map((action) => {
              const Icon = action.icon || FaArrowRight;
              return (
                <Link
                  key={action.path}
                  to={action.path}
                  className="dashboard-quick-link"
                >
                  <span className="dashboard-quick-link__icon" aria-hidden>
                    <Icon />
                  </span>
                  <span className="dashboard-quick-link__text">
                    <span className="dashboard-quick-link__label">
                      {action.label}
                    </span>
                    <span className="dashboard-quick-link__desc">
                      {action.description}
                    </span>
                  </span>
                  <FaArrowRight
                    className="dashboard-quick-link__arrow"
                    aria-hidden
                  />
                </Link>
              );
            })}
          </nav>
        </section>
      </div>
    </Container>
  );
};

Dashboard.propTypes = {};

const mapStateToProps = (state) => ({
  loggedInUser: state.auth.user,
  abbreviation: state.common?.commonSettings?.abbreviation || "",
});

export default connect(mapStateToProps, {
  loadUser,
  setAlert,
})(Dashboard);
