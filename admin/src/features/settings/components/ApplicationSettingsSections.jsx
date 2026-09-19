import { Card, Col, Form, Row, Button } from "react-bootstrap";
import { FaPlus, FaTrash } from "react-icons/fa";
import Errors from "@src/notifications/Errors";
import CustomSelect from "@src/components/common/CustomSelect";
import { getOptionByValue } from "@src/constants/CustomSelectValues";
import {
  getAvailablePlatformOptions,
  canAddSocialLink,
} from "../socialMediaFormHelpers";
import { MAX_IMAGE_SIZE_LABEL } from "@src/constants/imageUpload";

export const GeneralInformationSection = ({
  formData,
  errorList,
  isDisabled,
  logoPreview,
  onChange,
  onLogoChange,
}) => (
  <Card className="common-panel-card mb-4">
    <Card.Header>General Information</Card.Header>
    <Card.Body>
      <Row className="g-3">
        <Col md={6} lg={4}>
          <Form.Group controlId="name">
            <Form.Label>Full Name *</Form.Label>
            <Form.Control
              className={errorList.name ? "invalid" : ""}
              name="name"
              value={formData.name}
              onChange={onChange}
              disabled={isDisabled}
              required
            />
            <Errors current_key="name" key="name" />
          </Form.Group>
        </Col>
        <Col md={6} lg={4}>
          <Form.Group controlId="abbreviation">
            <Form.Label>Abbreviation</Form.Label>
            <Form.Control
              name="abbreviation"
              value={formData.abbreviation}
              onChange={onChange}
              disabled={isDisabled}
              placeholder="e.g., LTCL"
            />
          </Form.Group>
        </Col>
        <Col md={6} lg={4}>
          <Form.Group controlId="developedBy">
            <Form.Label>Developed By</Form.Label>
            <Form.Control
              name="developedBy"
              value={formData.developedBy}
              onChange={onChange}
              disabled={isDisabled}
              placeholder="e.g., Developed by Company Name"
            />
          </Form.Group>
        </Col>
        <Col md={6} lg={4}>
          <Form.Group controlId="developedByLink">
            <Form.Label>Portfolio Link</Form.Label>
            <Form.Control
              className={errorList.developedByLink ? "invalid" : ""}
              type="url"
              name="developedByLink"
              value={formData.developedByLink}
              onChange={onChange}
              disabled={isDisabled}
              placeholder="https://example.com/portfolio"
            />
            <Form.Text className="text-muted">
              Optional. Footer text becomes clickable when a link is added.
            </Form.Text>
            <Errors current_key="developedByLink" key="developedByLink" />
          </Form.Group>
        </Col>
        <Col md={8}>
          <Form.Group controlId="logo">
            <Form.Label>Application Logo</Form.Label>
            {logoPreview ? (
              <div className="settings-image-preview settings-image-preview--logo mb-2">
                <div className="settings-image-preview__frame">
                  <img src={logoPreview} alt="Logo preview" />
                </div>
              </div>
            ) : null}
            <Form.Control
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={onLogoChange}
              disabled={isDisabled}
            />
            <Form.Text className="text-muted">
              JPG/PNG/WEBP, max {MAX_IMAGE_SIZE_LABEL}.
            </Form.Text>
            <Errors current_key="logo" key="logo" />
          </Form.Group>
        </Col>
      </Row>
    </Card.Body>
  </Card>
);

export const AuthenticationSettingsSection = ({
  formData,
  isDisabled,
  onChange,
}) => (
  <Card className="common-panel-card mb-4">
    <Card.Header>Authentication Settings</Card.Header>
    <Card.Body>
      <Row className="g-3">
        <Col md={6}>
          <Form.Group controlId="loginEnabled">
            <Form.Check
              type="switch"
              name="loginEnabled"
              label="Enable Login"
              checked={formData.loginEnabled}
              onChange={onChange}
              disabled={isDisabled}
            />
            <Form.Text className="text-muted">
              When disabled, users will not be able to login
            </Form.Text>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group controlId="registerEnabled">
            <Form.Check
              type="switch"
              name="registerEnabled"
              label="Enable Registration"
              checked={formData.registerEnabled}
              onChange={onChange}
              disabled={isDisabled}
            />
            <Form.Text className="text-muted">
              When disabled, new user registration will be blocked
            </Form.Text>
          </Form.Group>
        </Col>
      </Row>
    </Card.Body>
  </Card>
);

export const SocialMediaSection = ({
  socialLinks,
  isDisabled,
  onSocialLinkField,
  addSocialLink,
  removeSocialLink,
}) => {
  const showAddLink = canAddSocialLink(socialLinks);

  return (
    <Card className="common-panel-card mb-4">
      <Card.Header>Social Media Links</Card.Header>
      <Card.Body>
        <p className="text-muted small mb-3">
          Add or remove social platforms shown in the footer and contact page.
          Each platform can be added only once. Profile URL is required.
        </p>

        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
          <span className="about-us-admin__section-meta mb-0">Platforms</span>
          <Button
            type="button"
            variant={null}
            className="btn btn--outline btn-sm"
            onClick={addSocialLink}
            disabled={isDisabled || !showAddLink}
          >
            <FaPlus className="me-1" />
            Add link
          </Button>
        </div>

        {socialLinks.length === 0 ? (
          <p className="text-muted small mb-0">
            No social links yet. Click &quot;Add link&quot; to add one.
          </p>
        ) : (
          socialLinks.map((link, index) => {
            const platformOptions = getAvailablePlatformOptions(
              socialLinks,
              index,
            );

            return (
              <div key={link.id} className="about-us-admin__section mb-3">
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                  <span className="about-us-admin__section-meta">
                    Link {index + 1}
                  </span>
                  <Button
                    type="button"
                    variant={null}
                    className="btn btn--danger btn-sm"
                    onClick={() => removeSocialLink(index)}
                    disabled={isDisabled}
                    aria-label={`Remove link ${index + 1}`}
                  >
                    <FaTrash />
                  </Button>
                </div>
                <Row className="g-3">
                  <Col md={4}>
                    <Form.Group controlId="platform">
                      <Form.Label>Platform</Form.Label>
                      <CustomSelect
                        className="entity-form__select"
                        options={platformOptions}
                        value={getOptionByValue(platformOptions, link.platform)}
                        onChange={(option) =>
                          onSocialLinkField(
                            index,
                            "platform",
                            option?.value ?? "facebook",
                          )
                        }
                        isDisabled={isDisabled}
                        isRequired
                        placeholder="Select platform"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={8}>
                    <Form.Group controlId="profile-url">
                      <Form.Label>Profile URL *</Form.Label>
                      <Form.Control
                        type="url"
                        name={`socialLinks.${index}.url`}
                        value={link.url}
                        onChange={(e) =>
                          onSocialLinkField(index, "url", e.target.value)
                        }
                        placeholder="https://..."
                        disabled={isDisabled}
                        required
                      />
                      <Errors
                        current_key={`socialLinks.${index}.url`}
                        key={`socialLinks.${index}.url`}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </div>
            );
          })
        )}
      </Card.Body>
    </Card>
  );
};
