import React, { useEffect, useMemo, useState } from "react";
import { getCarouselSections } from "@src/features/public/mediaActions";
import BouncingLoader from "@src/components/common/Loaders/BouncingLoader";
import HomeSectionHeader from "./HomeSectionHeader";
import ScrollReveal from "./ScrollReveal";

const accentLastWord = (title = "") => {
  const parts = String(title).trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) {
    return title;
  }
  const last = parts.pop();
  return (
    <>
      {parts.join(" ")} <span>{last}</span>
    </>
  );
};

const CarouselCard = ({ item }) => {
  const name = item.name?.trim() || "";
  const desc = item.shortDesc?.trim() || "";
  const imageUrl = item.imageUrl || "";
  const hasName = Boolean(name);
  const hasDesc = Boolean(desc);
  const hasImage = Boolean(imageUrl);
  const hasText = hasName || hasDesc;

  const modifiers = [
    hasImage ? "home-carousel__card--has-image" : "",
    hasName ? "home-carousel__card--has-name" : "",
    hasDesc ? "home-carousel__card--has-desc" : "",
    hasImage && hasText ? "home-carousel__card--stacked" : "",
    !hasImage && hasText ? "home-carousel__card--text-only" : "",
    hasImage && !hasText ? "home-carousel__card--image-only" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={`home-carousel__card ${modifiers}`.trim()}>
      {hasImage ? (
        <div className="home-carousel__media">
          <img
            src={imageUrl}
            alt={name || "Carousel item"}
            className="home-carousel__image"
            loading="lazy"
            decoding="async"
          />
        </div>
      ) : null}

      {hasText ? (
        <div className="home-carousel__content">
          {hasName ? <h3 className="home-carousel__title">{name}</h3> : null}
          {hasDesc ? <p className="home-carousel__desc">{desc}</p> : null}
        </div>
      ) : null}
    </article>
  );
};

const CarouselTrack = ({ group }) => {
  const direction = group.direction === "rtl" ? "rtl" : "ltr";
  const items = group.items || [];

  // Build one wide-enough sequence, then render it twice in equal groups
  // so translateX(-50%) loops without a jump.
  const sequence = useMemo(() => {
    if (items.length === 0) return [];
    const minCards = 6;
    const copies = Math.max(2, Math.ceil(minCards / items.length));
    const batch = [];
    for (let i = 0; i < copies; i += 1) {
      batch.push(...items);
    }
    return batch;
  }, [items]);

  const durationSec = Math.max(20, sequence.length * 4);

  if (items.length === 0) return null;

  const renderGroup = (suffix) => (
    <div className="home-carousel__group" aria-hidden={suffix === "b" ? true : undefined}>
      {sequence.map((item, index) => (
        <CarouselCard key={`${suffix}-${item._id}-${index}`} item={item} />
      ))}
    </div>
  );

  return (
    <div
      className={`home-carousel__viewport home-carousel__viewport--${direction}`}
    >
      <div
        className={`home-carousel__track home-carousel__track--${direction}`}
        style={{ "--carousel-duration": `${durationSec}s` }}
        aria-label={`${group.name} carousel`}
      >
        {renderGroup("a")}
        {renderGroup("b")}
      </div>
    </div>
  );
};

const CarouselSections = () => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSections = async () => {
      try {
        const data = await getCarouselSections();
        setSections(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching carousel sections:", error);
        setSections([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSections();
  }, []);

  if (loading) {
    return (
      <section className="home-carousel home-section-surface">
        <div className="container">
          <BouncingLoader />
        </div>
      </section>
    );
  }

  if (sections.length === 0) {
    return null;
  }

  return (
    <>
      {sections.map((group, groupIndex) => (
        <section
          key={group._id}
          className="home-carousel home-section-surface"
          id={`carousel-${group._id}`}
        >
          <div className="home-carousel__glow" aria-hidden="true" />
          <div className="container">
            <ScrollReveal delay={groupIndex * 80}>
              <HomeSectionHeader title={accentLastWord(group.name)} />
            </ScrollReveal>
            <CarouselTrack group={group} />
          </div>
        </section>
      ))}
    </>
  );
};

export default CarouselSections;
