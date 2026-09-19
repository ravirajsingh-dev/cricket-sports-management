import React, { useEffect, useId, useState } from "react";
import { FaChevronDown } from "react-icons/fa";
import { getFaqs, getFaqSettings } from "@src/features/public/mediaActions";
import BouncingLoader from "@src/components/common/Loaders/BouncingLoader";
import HomeSectionHeader from "./HomeSectionHeader";
import ScrollReveal from "./ScrollReveal";

const DEFAULT_TITLE = "Frequently Asked Questions";

const accentLastWord = (title) => {
  const text = (title || "").trim();
  if (!text) return DEFAULT_TITLE;
  const parts = text.split(/\s+/);
  if (parts.length < 2) return text;
  const last = parts.pop();
  return (
    <>
      {parts.join(" ")} <span>{last}</span>
    </>
  );
};

const normalizeCopy = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

/** Hide CMS description when it only repeats the section title. */
const resolveDescription = (title, description) => {
  const desc = String(description || "").trim();
  if (!desc) return "";
  const titleNorm = normalizeCopy(title || DEFAULT_TITLE);
  const descNorm = normalizeCopy(desc);
  if (!titleNorm) return desc;
  if (descNorm === titleNorm) return "";
  const stripped = descNorm.split(titleNorm).join("").trim();
  if (!stripped) return "";
  return desc;
};

const FaqItem = ({ faq, index, isOpen, onToggle, panelId, buttonId }) => {
  const number = String(index + 1).padStart(2, "0");

  return (
    <div className={`home-faq__item ${isOpen ? "is-open" : ""}`}>
      <h3 className="home-faq__question">
        <button
          type="button"
          id={buttonId}
          className="home-faq__trigger"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={onToggle}
        >
          <span className="home-faq__index" aria-hidden="true">
            {number}
          </span>
          <span className="home-faq__question-text">{faq.question}</span>
          <span className="home-faq__icon" aria-hidden="true">
            <FaChevronDown />
          </span>
        </button>
      </h3>

      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        className={`home-faq__panel ${isOpen ? "is-open" : ""}`}
        aria-hidden={!isOpen}
      >
        <div className="home-faq__panel-inner">
          <div className="home-faq__answer">
            {String(faq.answer || "")
              .split("\n")
              .filter(Boolean)
              .map((line, lineIndex) => (
                <p key={`${faq._id}-line-${lineIndex}`}>{line}</p>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const Faq = () => {
  const baseId = useId();
  const [faqs, setFaqs] = useState([]);
  const [settings, setSettings] = useState({ title: "", description: "" });
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const [faqSettings, faqItems] = await Promise.all([
          getFaqSettings(),
          getFaqs(),
        ]);

        if (faqSettings) {
          setSettings({
            title: faqSettings.title || "",
            description: faqSettings.description || "",
          });
        }

        const list = Array.isArray(faqItems) ? faqItems : [];
        setFaqs(list);
        if (list.length > 0) {
          setOpenId(list[0]._id);
        }
      } catch (error) {
        console.error("Error fetching FAQs:", error);
        setFaqs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFaqs();
  }, []);

  if (loading) {
    return (
      <section className="home-faq home-section-surface">
        <div className="container">
          <BouncingLoader />
        </div>
      </section>
    );
  }

  if (faqs.length === 0 && !settings.title && !settings.description) {
    return null;
  }

  const titleText = settings.title || DEFAULT_TITLE;
  const description = resolveDescription(titleText, settings.description);

  return (
    <section className="home-faq home-section-surface" id="faq">
      <div className="home-faq__glow" aria-hidden="true" />
      <div className="container">
        <HomeSectionHeader
          title={accentLastWord(titleText)}
          description={description}
        />

        {faqs.length > 0 ? (
          <div className="home-faq__list">
            {faqs.map((faq, index) => (
              <ScrollReveal
                key={faq._id}
                className="home-faq__reveal"
                delay={Math.min(index * 70, 280)}
              >
                <FaqItem
                  faq={faq}
                  index={index}
                  isOpen={openId === faq._id}
                  onToggle={() =>
                    setOpenId((prev) => (prev === faq._id ? null : faq._id))
                  }
                  panelId={`${baseId}-panel-${index}`}
                  buttonId={`${baseId}-btn-${index}`}
                />
              </ScrollReveal>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default Faq;
