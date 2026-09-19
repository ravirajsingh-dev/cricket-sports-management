import React from "react";
import PropTypes from "prop-types";
import { Alert, Button, Container } from "react-bootstrap";

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("App render error:", error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container className="py-5">
          <Alert variant="danger">
            <Alert.Heading>Something went wrong</Alert.Heading>
            <p className="mb-3">
              An unexpected error occurred. Try reloading the page.
            </p>
            <Button variant="outline-danger" onClick={this.handleReload}>
              Reload
            </Button>
          </Alert>
        </Container>
      );
    }

    return this.props.children;
  }
}

AppErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AppErrorBoundary;
