import React from "react";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { Form } from "react-bootstrap";

const EMPTY_ERRORS = {};

const Errors = ({ current_key }) => {
  const errorList = useSelector((state) => state.errors) ?? EMPTY_ERRORS;

  if (current_key in errorList) {
    return (
      <Form.Text
        id={`${current_key}-error`}
        role="alert"
        className="form-error-message"
      >
        {errorList[current_key]}
      </Form.Text>
    );
  }
  return null;
};

Errors.propTypes = {
  current_key: PropTypes.string.isRequired,
};

export default Errors;
