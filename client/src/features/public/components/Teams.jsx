import React, { useEffect, useState } from "react";
import { getTeams, getTeamSettings } from "@src/features/public/mediaActions";
import BouncingLoader from "@src/components/common/Loaders/BouncingLoader";
import HomeSectionHeader from "./HomeSectionHeader";
import ScrollReveal from "./ScrollReveal";

const Teams = () => {
  const [groups, setGroups] = useState([]);
  const [settings, setSettings] = useState({ title: "", description: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const [teamSettings, teamGroups] = await Promise.all([
          getTeamSettings(),
          getTeams(),
        ]);

        if (teamSettings) {
          setSettings({
            title: teamSettings.title || "",
            description: teamSettings.description || "",
          });
        }

        setGroups(Array.isArray(teamGroups) ? teamGroups : []);
      } catch (error) {
        console.error("Error fetching teams:", error);
        setGroups([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  if (loading) {
    return (
      <section className="home-teams home-section-surface">
        <div className="container">
          <BouncingLoader />
        </div>
      </section>
    );
  }

  if (groups.length === 0 && !settings.title && !settings.description) {
    return null;
  }

  return (
    <section className="home-teams home-section-surface" id="teams">
      <div className="home-teams__glow" aria-hidden="true" />
      <div className="container">
        <HomeSectionHeader
          title={settings.title || "Official Teams"}
          description={settings.description || ""}
        />

        {groups.length > 0 ? (
          <div className="home-teams__pools">
            {groups.map((group, groupIndex) => (
              <ScrollReveal
                key={group._id}
                className="home-teams__pool"
                delay={groupIndex * 100}
              >
                <div className="home-teams__pool-head">
                  <span className="home-teams__pool-rule" aria-hidden="true" />
                  <h3 className="home-teams__pool-title">{group.name}</h3>
                  <span className="home-teams__pool-rule" aria-hidden="true" />
                </div>

                <div className="home-teams__grid">
                  {(group.teams || []).map((team, teamIndex) => (
                    <article
                      key={team._id}
                      className="home-teams__card"
                      style={{
                        "--team-delay": `${Math.min(teamIndex, 9) * 45}ms`,
                      }}
                    >
                      <div className="home-teams__logo-wrap">
                        <span className="home-teams__logo-ring" aria-hidden="true" />
                        <img
                          src={team.logoUrl}
                          alt={`${team.name} logo`}
                          className="home-teams__logo"
                          loading="lazy"
                        />
                      </div>
                      <h4 className="home-teams__name">{team.name}</h4>
                    </article>
                  ))}
                </div>
              </ScrollReveal>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default Teams;
