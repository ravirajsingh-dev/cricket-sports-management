import React from "react";
import { Container, Row, Col } from "react-bootstrap";

const NoAccessPage = () => {
  return (
    <Container>
      <Row>
        <Col xs={12} className="text-center py-5">
          <div className="my-5">
            <h3 className="mb-3">No Access Assigned</h3>
            <p className="text-muted">
              You don't have access to any modules. Please contact an administrator
              to assign permissions.
            </p>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default NoAccessPage;
