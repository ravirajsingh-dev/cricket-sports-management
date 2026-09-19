import React, { useEffect, useRef, useState } from "react";
import {
  FaQuoteLeft,
  FaStar,
} from "react-icons/fa";
import {
  HiOutlineCheckBadge,
  HiOutlineHandRaised,
  HiOutlineHeart,
  HiOutlineMapPin,
  HiOutlineShieldCheck,
  HiOutlineTrophy,
  HiOutlineUserGroup,
} from "react-icons/hi2";
import { MdSportsCricket, MdOutlineGpsFixed, MdWorkspacePremium } from "react-icons/md";
import { getHomeShowcase } from "@src/features/public/mediaActions";
import BouncingLoader from "@src/components/common/Loaders/BouncingLoader";
import AdvancedModal from "@src/components/common/Modal/AdvancedModal";
import HomeSectionHeader from "./HomeSectionHeader";
import ScrollReveal from "./ScrollReveal";

const IMPACT_ICONS = {
  trophy: HiOutlineTrophy,
  "map-pin": HiOutlineMapPin,
  pulse: HiOutlineHeart,
  users: HiOutlineUserGroup,
  target: MdOutlineGpsFixed,
  shield: HiOutlineShieldCheck,
  check: HiOutlineCheckBadge,
  medal: MdWorkspacePremium,
  cricket: MdSportsCricket,
  handshake: HiOutlineHandRaised,
  // legacy CMS value
  star: MdWorkspacePremium,
};

const accentLastWord = (title) => {
  const text = (title || "").trim();
  if (!text) return null;
  const parts = text.split(/\s+/);
  if (parts.length < 2) return text;
  const last = parts.pop();
  return (
    <>
      {parts.join(" ")} <span>{last}</span>
    </>
  );
};

/** Avoid showing description that just repeats the title. */
const cleanDescription = (title = "", description = "") => {
  const desc = String(description || "").replace(/\s+/g, " ").trim();
  if (!desc) return "";
  const normalizedTitle = String(title || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  const normalizedDesc = desc.toLowerCase();
  if (!normalizedTitle) return desc;
  if (normalizedDesc === normalizedTitle) return "";
  if (normalizedDesc.replace(new RegExp(normalizedTitle, "gi"), "").trim() === "") {
    return "";
  }
  return desc;
};

const StarRating = ({ rating = 5 }) => (
  <div className="home-showcase__stars" aria-label={`${rating} out of 5 stars`}>
    {Array.from({ length: 5 }).map((_, index) => (
      <FaStar
        key={`star-${index}`}
        className={index < rating ? "is-on" : "is-off"}
        aria-hidden="true"
      />
    ))}
  </div>
);

const ImpactSection = ({ impact }) => {
  const items = Array.isArray(impact?.items) ? impact.items : [];
  if (!items.length) return null;

  return (
    <section className="home-showcase home-showcase--impact" id="impact">
      <div className="container">
        <HomeSectionHeader
          title={accentLastWord(impact.title) || impact.title}
          description={cleanDescription(impact.title, impact.description)}
        />
        <div
          className="home-showcase__impact-grid"
          data-count={Math.min(items.length, 10)}
        >
          {items.map((item, index) => {
            const Icon = IMPACT_ICONS[item.icon] || HiOutlineTrophy;
            return (
              <ScrollReveal
                key={item.id || `${item.value}-${index}`}
                className="home-showcase__stat"
                delay={index * 60}
              >
                <span className="home-showcase__stat-glow" aria-hidden="true" />
                <span className="home-showcase__stat-icon" aria-hidden="true">
                  <Icon />
                </span>
                <span className="home-showcase__stat-copy">
                  <span className="home-showcase__stat-label">{item.label}</span>
                  <strong className="home-showcase__stat-value">{item.value}</strong>
                </span>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const formatBadgeHeading = (label = "") => {
  const text = String(label || "").trim();
  if (!text) return "Team";
  return text
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const groupPeopleByBadge = (selectors = {}) => {
  const people = Array.isArray(selectors?.people) ? selectors.people : [];
  const badges = Array.isArray(selectors?.badges) ? selectors.badges : [];
  if (!people.length) return [];

  const used = new Set();
  const groups = [];

  const pushGroup = (label, members, direction = "ltr") => {
    if (!members.length) return;
    groups.push({
      key: label || "ungrouped",
      label: label || "",
      direction: direction === "rtl" ? "rtl" : "ltr",
      people: members,
    });
  };

  badges.forEach((badge) => {
    const label = String(badge?.label || "").trim();
    const badgeId = String(badge?.id || "").trim();
    const direction = badge?.direction === "rtl" ? "rtl" : "ltr";
    const members = people.filter((person) => {
      if (used.has(person)) return false;
      const personId = String(person?.badgeId || "").trim();
      const personBadge = String(person?.badge || "").trim();
      return (
        (badgeId && personId === badgeId) ||
        (label && personBadge.toUpperCase() === label.toUpperCase())
      );
    });
    members.forEach((person) => used.add(person));
    pushGroup(label, members, direction);
  });

  const leftover = people.filter((person) => !used.has(person));

  if (leftover.length) {
    const byLabel = new Map();
    leftover.forEach((person) => {
      const label = String(person?.badge || "").trim();
      if (!byLabel.has(label)) byLabel.set(label, []);
      byLabel.get(label).push(person);
    });
    byLabel.forEach((members, label) => pushGroup(label, members, "ltr"));
  }

  return groups;
};

const SELECTORS_PER_ROW_MOBILE = 3;
const SELECTORS_PER_ROW_DESKTOP = 6;
const SELECTORS_DESKTOP_MQ = "(min-width: 992px)";

const PersonCard = ({ person }) => (
  <article className="home-showcase__card">
    <div className="home-showcase__card-tilt">
      <span className="home-showcase__card-glow" aria-hidden="true" />
      <img
        src={person.imageUrl}
        alt={person.name || "Team member"}
        className="home-showcase__card-img"
        loading="lazy"
        decoding="async"
      />
      <div className="home-showcase__card-shade" aria-hidden="true" />
      <div className="home-showcase__card-meta">
        {person.name ? (
          <h3 className="home-showcase__person-name">{person.name}</h3>
        ) : null}
        {person.role ? (
          <p className="home-showcase__person-role">{person.role}</p>
        ) : null}
      </div>
    </div>
  </article>
);

const PeopleRow = ({ people, groupKey, direction = "ltr" }) => {
  const scrollDirection = direction === "rtl" ? "rtl" : "ltr";
  const [perRow, setPerRow] = useState(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia(SELECTORS_DESKTOP_MQ).matches
        ? SELECTORS_PER_ROW_DESKTOP
        : SELECTORS_PER_ROW_MOBILE;
    }
    return SELECTORS_PER_ROW_MOBILE;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const media = window.matchMedia(SELECTORS_DESKTOP_MQ);
    const sync = () => {
      setPerRow(
        media.matches ? SELECTORS_PER_ROW_DESKTOP : SELECTORS_PER_ROW_MOBILE,
      );
    };
    sync();
    if (media.addEventListener) {
      media.addEventListener("change", sync);
      return () => media.removeEventListener("change", sync);
    }
    media.addListener(sync);
    return () => media.removeListener(sync);
  }, []);

  const useCarousel = people.length > perRow;

  if (!useCarousel) {
    return (
      <div className="home-showcase__people" data-per-row={perRow}>
        {people.map((person, index) => (
          <PersonCard
            key={person.id || `${groupKey}-${person.name}-${index}`}
            person={person}
          />
        ))}
      </div>
    );
  }

  // Duplicate sequence so translateX(-50%) loops without a jump
  const copies = Math.max(2, Math.ceil(8 / people.length));
  const sequence = [];
  for (let i = 0; i < copies; i += 1) {
    sequence.push(...people);
  }
  const durationSec = Math.max(18, sequence.length * 3.2);

  const renderGroup = (suffix) => (
    <div
      className="home-showcase__marquee-group"
      aria-hidden={suffix === "b" ? true : undefined}
    >
      {sequence.map((person, index) => (
        <PersonCard
          key={`${suffix}-${person.id || person.name}-${index}`}
          person={person}
        />
      ))}
    </div>
  );

  return (
    <div
      className={`home-showcase__marquee home-showcase__marquee--${scrollDirection}`}
      data-per-row={perRow}
    >
      <div
        className={`home-showcase__marquee-track home-showcase__marquee-track--${scrollDirection}`}
        style={{ "--selectors-duration": `${durationSec}s` }}
        aria-label={`${groupKey} carousel`}
      >
        {renderGroup("a")}
        {renderGroup("b")}
      </div>
    </div>
  );
};

const SelectorsSection = ({ selectors }) => {
  const groups = groupPeopleByBadge(selectors);
  if (!groups.length) return null;

  return (
    <section className="home-showcase home-showcase--selectors" id="selectors">
      <div className="container">
        <HomeSectionHeader
          title={accentLastWord(selectors.title) || selectors.title}
          description={cleanDescription(selectors.title, selectors.description)}
        />
        <div className="home-showcase__pools">
          {groups.map((group, groupIndex) => (
            <div
              key={group.key || `group-${groupIndex}`}
              className="home-showcase__pool"
            >
              {group.label ? (
                <div className="home-showcase__pool-head">
                  <span className="home-showcase__pool-rule" aria-hidden="true" />
                  <h3 className="home-showcase__pool-title">
                    {formatBadgeHeading(group.label)}
                  </h3>
                  <span className="home-showcase__pool-rule" aria-hidden="true" />
                </div>
              ) : null}
              <PeopleRow
                people={group.people}
                groupKey={group.key || `group-${groupIndex}`}
                direction={group.direction}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const TESTIMONIALS_PER_VIEW_MOBILE = 2;
const TESTIMONIALS_PER_VIEW_DESKTOP = 3;
const TESTIMONIALS_DESKTOP_MQ = "(min-width: 992px)";

const QuoteCard = ({ item, onReadMore }) => {
  const name = String(item.name || "").trim();
  const role = String(item.text || "").trim();
  const quote = String(item.quote || "").trim();
  const rating = item.rating || 5;
  const [canExpand, setCanExpand] = useState(false);
  const bodyRef = useRef(null);

  useEffect(() => {
    const measure = () => {
      const el = bodyRef.current;
      if (!el) return;
      setCanExpand(el.scrollHeight > el.clientHeight + 2);
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [quote]);

  return (
    <article className="home-showcase__quote-card">
      <span className="home-showcase__quote-glow" aria-hidden="true" />
      <FaQuoteLeft className="home-showcase__quote-icon" aria-hidden />

      {quote ? (
        <div className="home-showcase__quote-text">
          <div ref={bodyRef} className="home-showcase__quote-body">
            {quote
              .split("\n")
              .filter(Boolean)
              .map((line, lineIndex) => (
                <p key={`${item.id || name}-line-${lineIndex}`}>{line}</p>
              ))}
          </div>
          {canExpand ? (
            <button
              type="button"
              className="home-showcase__quote-more"
              onClick={(event) => {
                event.stopPropagation();
                onReadMore?.(item);
              }}
            >
              Read more
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="home-showcase__quote-meta">
        {(name || role) && (
          <div className="home-showcase__quote-identity">
            {name ? (
              <strong className="home-showcase__quote-name">{name}</strong>
            ) : null}
            {role ? (
              <span className="home-showcase__quote-subtext">{role}</span>
            ) : null}
          </div>
        )}
        <StarRating rating={rating} />
      </div>
    </article>
  );
};

const TestimonialDetailsModal = ({ show, onHide, item }) => {
  if (!item) return null;

  const name = String(item.name || "").trim();
  const role = String(item.text || "").trim();
  const quote = String(item.quote || "").trim();
  const rating = item.rating || 5;

  return (
    <AdvancedModal
      show={show}
      onHide={onHide}
      title={name || "Testimonial"}
      size="md"
      closeButton
      className="testimonial-details-modal"
      bodyClassName="testimonial-details-modal-body"
    >
      <div className="testimonial-details">
        {quote ? (
          <div className="testimonial-details__quote">
            <FaQuoteLeft className="testimonial-details__icon" aria-hidden />
            {quote
              .split("\n")
              .filter(Boolean)
              .map((line, lineIndex) => (
                <p key={`modal-line-${lineIndex}`}>{line}</p>
              ))}
          </div>
        ) : null}
        <div className="testimonial-details__meta">
          {name ? (
            <strong className="testimonial-details__name">{name}</strong>
          ) : null}
          {role ? (
            <span className="testimonial-details__role">{role}</span>
          ) : null}
          <StarRating rating={rating} />
        </div>
      </div>
    </AdvancedModal>
  );
};

const TestimonialsTrack = ({ items, onReadMore }) => {
  const [perView, setPerView] = useState(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia(TESTIMONIALS_DESKTOP_MQ).matches
        ? TESTIMONIALS_PER_VIEW_DESKTOP
        : TESTIMONIALS_PER_VIEW_MOBILE;
    }
    return TESTIMONIALS_PER_VIEW_MOBILE;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const media = window.matchMedia(TESTIMONIALS_DESKTOP_MQ);
    const sync = () => {
      setPerView(
        media.matches
          ? TESTIMONIALS_PER_VIEW_DESKTOP
          : TESTIMONIALS_PER_VIEW_MOBILE,
      );
    };
    sync();
    if (media.addEventListener) {
      media.addEventListener("change", sync);
      return () => media.removeEventListener("change", sync);
    }
    media.addListener(sync);
    return () => media.removeListener(sync);
  }, []);

  const useCarousel = items.length > perView;

  if (!useCarousel) {
    return (
      <div className="home-showcase__quotes" data-per-view={perView}>
        {items.map((item, index) => (
          <ScrollReveal
            key={item.id || `quote-${index}`}
            className="home-showcase__quote-wrap"
            delay={index * 80}
          >
            <QuoteCard item={item} onReadMore={onReadMore} />
          </ScrollReveal>
        ))}
      </div>
    );
  }

  // Duplicate sequence so translateX(-50%) loops without a jump
  const copies = Math.max(2, Math.ceil(8 / items.length));
  const sequence = [];
  for (let i = 0; i < copies; i += 1) {
    sequence.push(...items);
  }
  const durationSec = Math.max(22, sequence.length * 4.5);

  const renderGroup = (suffix) => (
    <div
      className="home-showcase__quotes-marquee-group"
      aria-hidden={suffix === "b" ? true : undefined}
    >
      {sequence.map((item, index) => (
        <div
          key={`${suffix}-${item.id || item.name}-${index}`}
          className="home-showcase__quote-wrap"
        >
          <QuoteCard item={item} onReadMore={onReadMore} />
        </div>
      ))}
    </div>
  );

  return (
    <div className="home-showcase__quotes-marquee" data-per-view={perView}>
      <div
        className="home-showcase__quotes-marquee-track"
        style={{ "--quotes-duration": `${durationSec}s` }}
        aria-label="Testimonials carousel"
      >
        {renderGroup("a")}
        {renderGroup("b")}
      </div>
    </div>
  );
};

const TestimonialsSection = ({ testimonials }) => {
  const items = Array.isArray(testimonials?.items) ? testimonials.items : [];
  const [selected, setSelected] = useState(null);

  if (!items.length) return null;

  return (
    <section
      className="home-showcase home-showcase--testimonials"
      id="testimonials"
    >
      <div className="container">
        <HomeSectionHeader
          title={accentLastWord(testimonials.title) || testimonials.title}
          description={cleanDescription(
            testimonials.title,
            testimonials.description,
          )}
        />
        <TestimonialsTrack items={items} onReadMore={setSelected} />
      </div>

      <TestimonialDetailsModal
        show={Boolean(selected)}
        onHide={() => setSelected(null)}
        item={selected}
      />
    </section>
  );
};

const HomeShowcase = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShowcase = async () => {
      try {
        const showcase = await getHomeShowcase();
        setData(showcase);
      } catch (error) {
        console.error("Error fetching home showcase:", error);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchShowcase();
  }, []);

  if (loading) {
    return (
      <section className="home-showcase home-section-surface">
        <div className="container">
          <BouncingLoader />
        </div>
      </section>
    );
  }

  if (!data) return null;

  const hasImpact = (data.impact?.items || []).length > 0;
  const hasSelectors = (data.selectors?.people || []).length > 0;
  const hasTestimonials = (data.testimonials?.items || []).length > 0;

  if (!hasImpact && !hasSelectors && !hasTestimonials) {
    return null;
  }

  return (
    <>
      <ImpactSection impact={data.impact} />
      <SelectorsSection selectors={data.selectors} />
      <TestimonialsSection testimonials={data.testimonials} />
    </>
  );
};

export default HomeShowcase;
