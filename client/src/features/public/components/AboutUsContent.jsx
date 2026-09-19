import { Fragment, useState } from "react";
import PropTypes from "prop-types";
import { Container } from "react-bootstrap";
import ScrollReveal from "./ScrollReveal";

const accentLastWord = (title) => {
  const text = (title || "").trim();
  if (!text) return "About Us";
  const parts = text.split(/\s+/);
  if (parts.length < 2) return text;
  const last = parts.pop();
  return (
    <>
      {parts.join(" ")} <span>{last}</span>
    </>
  );
};

// Char truncate (not CSS line-clamp) so text can wrap under floated images.
const COLLAPSED_CHARS = 420;

const truncateAtWord = (value, maxChars) => {
  const text = String(value || "").trim();
  if (text.length <= maxChars) {
    return { preview: text, truncated: false };
  }
  const slice = text.slice(0, maxChars);
  const breakAt = Math.max(slice.lastIndexOf(" "), slice.lastIndexOf("\n"));
  const preview = (
    breakAt > maxChars * 0.55 ? slice.slice(0, breakAt) : slice
  ).trimEnd();
  return { preview: `${preview}…`, truncated: true };
};

const splitParagraphs = (value) =>
  String(value || "")
    .trim()
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

const renderParagraphLines = (para) =>
  para.split("\n").map((line, j, arr) => (
    <Fragment key={j}>
      {line}
      {j < arr.length - 1 ? <br /> : null}
    </Fragment>
  ));

const AboutDescription = ({ text }) => {
  const [expanded, setExpanded] = useState(false);
  const trimmed = String(text || "").trim();
  if (!trimmed) return null;

  const { preview, truncated } = truncateAtWord(trimmed, COLLAPSED_CHARS);
  const shown = expanded ? trimmed : preview;
  const paragraphs = splitParagraphs(shown);
  const toggleLabel = expanded ? "Read less" : "Read more";

  return (
    <div className="home-about__text">
      {paragraphs.map((para, i) => {
        const isLast = i === paragraphs.length - 1;
        return (
          <p key={i}>
            {renderParagraphLines(para)}
            {truncated && isLast ? (
              <>
                {" "}
                <button
                  type="button"
                  className="home-about__read-more"
                  onClick={() => setExpanded((prev) => !prev)}
                >
                  {toggleLabel}
                </button>
              </>
            ) : null}
          </p>
        );
      })}
    </div>
  );
};

AboutDescription.propTypes = {
  text: PropTypes.string,
};

const getVisibleAboutSections = (aboutUs = {}) => {
  const sections = Array.isArray(aboutUs.sections) ? aboutUs.sections : [];
  return sections.filter(
    (sec) => sec?.heading?.trim() || sec?.description?.trim() || sec?.imageUrl,
  );
};

export const hasAboutUsContent = (aboutUs = {}) => {
  const visibleSections = getVisibleAboutSections(aboutUs);
  return Boolean(
    aboutUs.title?.trim() || aboutUs.intro?.trim() || visibleSections.length > 0,
  );
};

const AboutUsContent = ({ aboutUs = {}, embedded = false }) => {
  const visibleSections = getVisibleAboutSections(aboutUs);
  const pageTitle = aboutUs.title?.trim() || "About Us";
  const hasIntro = Boolean(aboutUs.intro?.trim());

  return (
    <div className={`home-about${embedded ? " home-about--embedded" : ""}`}>
      <div className="home-about__ambiance home-about__ambiance--a" aria-hidden="true" />
      <div className="home-about__ambiance home-about__ambiance--b" aria-hidden="true" />
      <Container>
        <article className="home-about__shell">
          <header className="home-about__intro">
            <ScrollReveal>
              <p className="home-about__eyebrow">Our Story</p>
              <h2 className="home-about__title">{accentLastWord(pageTitle)}</h2>
              {hasIntro ? (
                <p className="home-about__lead">{aboutUs.intro.trim()}</p>
              ) : null}
              <span
                className="home-section-header__line home-about__intro-line"
                aria-hidden="true"
              />
            </ScrollReveal>
          </header>

          {visibleSections.length > 0 ? (
            <div className="home-about__body">
              {visibleSections.map((sec, index) => {
                const reverse = index % 2 === 1;
                const hasImage = Boolean(sec.imageUrl);
                const hasHeading = Boolean(sec.heading?.trim());
                const hasDescription = Boolean(sec.description?.trim());
                const rowMods = [
                  reverse ? "home-about__row--reverse" : "",
                  !hasImage && (hasHeading || hasDescription)
                    ? "home-about__row--text-only"
                    : "",
                  hasImage && !hasHeading && !hasDescription
                    ? "home-about__row--image-only"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <ScrollReveal
                    key={sec.id || `about-section-${index}`}
                    className={`home-about__row${rowMods ? ` ${rowMods}` : ""}`}
                    delay={Math.min(index * 90, 270)}
                  >
                    {hasImage ? (
                      <figure className="home-about__media">
                        <span className="home-about__media-glow" aria-hidden="true" />
                        <span className="home-about__media-ring" aria-hidden="true" />
                        <img
                          src={sec.imageUrl}
                          alt={sec.heading?.trim() || `Section ${index + 1}`}
                          loading="lazy"
                        />
                      </figure>
                    ) : null}

                    {hasHeading ? (
                      <h3 className="home-about__heading">
                        <span className="home-about__heading-text">
                          {sec.heading.trim()}
                        </span>
                        <span
                          className="home-about__heading-line"
                          aria-hidden="true"
                        />
                      </h3>
                    ) : null}

                    {hasDescription ? (
                      <AboutDescription text={sec.description} />
                    ) : null}
                  </ScrollReveal>
                );
              })}
            </div>
          ) : null}
        </article>
      </Container>
    </div>
  );
};

AboutUsContent.propTypes = {
  aboutUs: PropTypes.object,
  embedded: PropTypes.bool,
};

export default AboutUsContent;
