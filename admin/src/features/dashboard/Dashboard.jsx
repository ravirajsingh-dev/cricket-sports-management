import React, { useEffect, useState } from "react";
import { Card, Col, Container, Row } from "react-bootstrap";
import { Link } from "react-router";

import AppBreadCrumb from "@src/components/common/AppBreadCrumb";
import BouncingLoader from "@src/components/common/Loaders/BouncingLoader";
import api from "@src/utils/axiosSetup";
import { normalizeApiError } from "@src/utils/apiError";

const STAT_CARDS = [
  { key: "users", label: "Users", to: "/admin/users-list" },
  { key: "news", label: "News", to: "/admin/news" },
  { key: "videos", label: "Videos", to: "/admin/video" },
  { key: "galleryImages", label: "Gallery", to: "/admin/gallery" },
  { key: "sliderBanners", label: "Slider", to: "/admin/slider" },
  { key: "teams", label: "Teams", to: "/admin/teams" },
  { key: "faqs", label: "FAQ", to: "/admin/faq" },
  { key: "contactMessages", label: "Contact Messages", to: "/admin/contact-messages" },
  { key: "subAdmins", label: "Sub-admins", to: "/admin/sub-admins" },
];

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await api.get("/api/admin/dashboard/stats");
        if (!cancelled && res.data?.status === true) {
          setStats(res.data.response || {});
          setError("");
        } else if (!cancelled) {
          setError(res.data?.message || "Unable to load dashboard stats");
        }
      } catch (err) {
        if (!cancelled) {
          setError(normalizeApiError(err).message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Container fluid>
      <AppBreadCrumb breadcrumbs={[{ name: "Dashboard" }]} />

      <Card className="common-panel-card mb-3">
        <Card.Body>
          <h4 className="mb-1">Admin Dashboard</h4>
          <p className="text-muted mb-0">
            Overview of portal content. Use the sidebar for full management.
          </p>
        </Card.Body>
      </Card>

      {loading ? (
        <BouncingLoader className="bouncing-loader-container--compact" />
      ) : error ? (
        <Card className="common-panel-card">
          <Card.Body className="text-danger">{error}</Card.Body>
        </Card>
      ) : (
        <Row className="g-3">
          {STAT_CARDS.map(({ key, label, to }) => (
            <Col key={key} xs={12} sm={6} lg={4}>
              <Card className="common-panel-card h-100">
                <Card.Body>
                  <div className="text-muted small mb-1">{label}</div>
                  <div className="fs-3 fw-semibold mb-2">
                    {Number(stats?.[key] ?? 0).toLocaleString()}
                  </div>
                  <Link to={to} className="small">
                    Manage {label.toLowerCase()}
                  </Link>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default AdminDashboard;
