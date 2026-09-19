import PropTypes from "prop-types";
import { Form, InputGroup } from "react-bootstrap";
import { useMemo } from "react";

import {
  createMemberIdChangeHandler,
  getMemberIdPhonePart,
  getMemberIdPhonePlaceholder,
  normalizeAbbreviation,
  MEMBER_ID_PHONE_LENGTH,
} from "@src/utils/memberIdFormatter";

/**
 * Member ID input: fixed Abbreviation prefix + editable 10-digit phone
 */
const MemberIdInput = ({
  id = "memberId",
  name = "memberId",
  value = "",
  onChange,
  label = "Member ID",
  abbreviation = "",
  disabled = false,
  className = "",
}) => {
  const prefix = normalizeAbbreviation(abbreviation);
  const phoneValue = getMemberIdPhonePart(value, abbreviation);

  const handleChange = useMemo(
    () => createMemberIdChangeHandler(onChange, name, abbreviation),
    [onChange, name, abbreviation],
  );

  return (
    <Form.Group controlId={id}>
      {label ? <Form.Label>{label}</Form.Label> : null}
      <InputGroup>
        {prefix ? (
          <InputGroup.Text title="Abbreviation">{prefix}</InputGroup.Text>
        ) : null}
        <Form.Control
          name={name}
          value={phoneValue}
          onChange={handleChange}
          placeholder={getMemberIdPhonePlaceholder()}
          maxLength={MEMBER_ID_PHONE_LENGTH}
          inputMode="numeric"
          autoComplete="off"
          disabled={disabled}
          className={className}
        />
      </InputGroup>
    </Form.Group>
  );
};

MemberIdInput.propTypes = {
  id: PropTypes.string,
  name: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string,
  abbreviation: PropTypes.string,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

export default MemberIdInput;
