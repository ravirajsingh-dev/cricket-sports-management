import React from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { useNavigate } from "react-router";
import { useSelector } from "react-redux";

const NotFoundPage = () => {
  const navigate = useNavigate();
  const commonSettings = useSelector((state) => state.common?.commonSettings);
  const loadingCommonSettings = useSelector(
    (state) => state.common?.loadingCommonSettings,
  );
  const abbreviation = commonSettings?.abbreviation;

  const titleText = loadingCommonSettings
    ? "Loading..."
    : abbreviation
      ? `A Small Pause in ${abbreviation}`
      : "Page Not Found";
  const buttonText = abbreviation
    ? `Go Back to ${abbreviation} Home`
    : "Go Back to Home";

  return (
    <Container fluid>
      <Row className="justify-content-center align-items-center h-100">
        <Col xs={12} md={8} lg={6} className="py-5 text-center">
          <h1 className="mb-3">{titleText}</h1>
          <p className="mb-4 text-muted">
            The page you're looking for isn't available right now.
            <br />
            We'll get you back on track.
          </p>
          <Button
            variant={null}
            className="btn-primary"
            onClick={() => navigate("/")}
          >
            {buttonText}
          </Button>
        </Col>
      </Row>
    </Container>
  );
};

export default NotFoundPage;
