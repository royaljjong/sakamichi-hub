"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import type { Group, Member } from "@/lib/schema";
import type { PortalDataset } from "@/lib/portal-schema";
import type { MemberVideo } from "@/lib/videos-schema";
import { MemberAvatar } from "@/components/member/MemberAvatar";
import { YouTubeIcon, TikTokIcon } from "@/components/ui/icons";

type Locale = "ja" | "ko" | "en";
type Family = "sakamichi" | "akb48g";
export type HomeMember = Pick<
  Member,
  | "id"
  | "name"
  | "primaryGroupId"
  | "status"
  | "birthDate"
  | "imageUrl"
  | "avatar"
> & {
  links: Array<Pick<Member["links"][number], "type" | "url" | "status">>;
};

function Rail({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (direction: number) =>
    ref.current?.scrollBy({
      left: direction * Math.min(ref.current.clientWidth * 0.82, 720),
      behavior: "smooth",
    });
  return (
    <div>
      <div className="mb-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => move(-1)}
          aria-label={`${label} previous`}
          className="rail-button"
        >
          ←
        </button>
        <button
          type="button"
          onClick={() => move(1)}
          aria-label={`${label} next`}
          className="rail-button"
        >
          →
        </button>
      </div>
      <div
        ref={ref}
        className="hide-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3"
      >
        {children}
      </div>
    </div>
  );
}

export function HomePortal({
  groups,
  members,
  locale,
  portal,
  videos,
}: {
  groups: Group[];
  members: HomeMember[];
  locale: string;
  portal: PortalDataset;
  videos: MemberVideo[];
}) {
  const t = useTranslations("home");
  const tFranchise = useTranslations("franchise");
  const tMember = useTranslations("member");
  const lang = (["ja", "ko", "en"].includes(locale) ? locale : "ja") as Locale;
  const [family, setFamily] = useState<Family>("sakamichi");
  const [hasSelected, setHasSelected] = useState(false);
  const [failedPosters, setFailedPosters] = useState<Set<string>>(
    () => new Set(),
  );
  const [failedEventLogos, setFailedEventLogos] = useState<Set<string>>(
    () => new Set(),
  );
  const familyGroups = useMemo(
    () => groups.filter((group) => group.franchise === family),
    [groups, family],
  );
  const venues = new Map(portal.venues.map((venue) => [venue.id, venue]));
  const groupMap = new Map(groups.map((group) => [group.id, group]));
  const today = new Date();
  const month = today.getMonth() + 1;
  const todayMd = `${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const localized = (value: { ja: string; ko: string; en: string }) =>
    value[lang] || value.ja;

  const [activeSection, setActiveSection] = useState<string>("section-family");

  const committedGroup = hasSelected
    ? family === "sakamichi"
      ? "nogizaka46"
      : "akb48"
    : "home";
  const setPreview = (id: string) =>
    document.documentElement.setAttribute("data-group", id);
  const clearPreview = () =>
    document.documentElement.setAttribute("data-group", committedGroup);
  useEffect(() => {
    document.documentElement.setAttribute("data-group", committedGroup);
  }, [committedGroup]);

  // IntersectionObserver for mini-nav highlight
  const miniNavSections = useMemo(
    () => [
      { id: "section-family", labelKey: "navFamily" as const },
      { id: "section-groups", labelKey: "navGroups" as const },
      { id: "section-live", labelKey: "navLive" as const },
      { id: "section-birthdays", labelKey: "navBirthdays" as const },
      { id: "section-youtube", labelKey: "navYoutube" as const },
      { id: "section-tiktok", labelKey: "navTiktok" as const },
    ],
    [],
  );

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      }
    },
    [],
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin: "-20% 0px -60% 0px",
      threshold: 0,
    });
    for (const { id } of miniNavSections) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [miniNavSections, handleIntersect]);

  const selectFamily = (next: Family) => {
    setFamily(next);
    setHasSelected(true);
  };
  const eventsFor = (target: Family) =>
    portal.events
      .filter((event) =>
        event.groupIds.some(
          (id) => groups.find((g) => g.id === id)?.franchise === target,
        ),
      )
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const tBirthday = useTranslations("birthday");
  const birthdayBucketsFor = (target: Family) => {
    const filtered = members.filter(
      (member) =>
        groups.find((g) => g.id === member.primaryGroupId)?.franchise ===
          target && Number(member.birthDate?.slice(5, 7)) === month,
    );
    const todayBucket: HomeMember[] = [];
    const upcoming: HomeMember[] = [];
    const past: HomeMember[] = [];
    for (const m of filtered) {
      const md = (m.birthDate ?? "").slice(5);
      if (md === todayMd) todayBucket.push(m);
      else if (md > todayMd) upcoming.push(m);
      else past.push(m);
    }
    upcoming.sort((a, b) =>
      (a.birthDate ?? "").slice(5).localeCompare((b.birthDate ?? "").slice(5)),
    );
    past.sort((a, b) =>
      (a.birthDate ?? "").slice(5).localeCompare((b.birthDate ?? "").slice(5)),
    );
    return { today: todayBucket, upcoming, past, total: filtered.length };
  };

  // Section 5 & 7: channel member helpers.
  // Include graduates — most curated official channels belong to graduate
  // members (Shiraishi Mai, Sashihara Rino, Kashiwagi Yuki, etc.) whose
  // channels remain active post-graduation.
  const ytMembersFor = (target: Family) =>
    members.filter(
      (m) =>
        groups.find((g) => g.id === m.primaryGroupId)?.franchise === target &&
        m.links?.some((l) => l.type === "youtube" && l.status !== "dead"),
    );
  const ttMembersFor = (target: Family) =>
    members.filter(
      (m) =>
        groups.find((g) => g.id === m.primaryGroupId)?.franchise === target &&
        m.links?.some((l) => l.type === "tiktok" && l.status !== "dead"),
    );

  // Section 6 & 8: video helpers
  const ytVideosFor = (target: Family) =>
    videos
      .filter((v) => v.platform === "youtube" && v.franchise === target)
      .slice()
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
      .slice(0, 20);
  // ttVideosFor removed: TikTok has no reliable public video feed API
  // (Nitter/RSSHub blocked, Playwright detected). Users can visit
  // individual TikTok channels via the channel rail below.

  const getMemberName = (member: HomeMember) =>
    lang === "ko"
      ? member.name.ko.hangul
      : lang === "en"
        ? member.name.en.romaji
        : member.name.ja.kanji;

  return (
    <div className="space-y-12 pb-8">
      {/* Mini-nav: desktop sticky, mobile scrollable */}
      <nav
        aria-label="Page sections"
        className="sticky top-0 z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2 bg-[color-mix(in_oklab,var(--page-bg,white)_85%,transparent)] backdrop-blur-sm border-b border-[color-mix(in_oklab,var(--g-ink)_8%,transparent)]"
      >
        <div className="flex gap-1 overflow-x-auto hide-scrollbar sm:flex-wrap">
          {miniNavSections.map(({ id, labelKey }) => (
            <a
              key={id}
              href={`#${id}`}
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById(id)
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={[
                "shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide transition-colors whitespace-nowrap",
                activeSection === id
                  ? "bg-[var(--g-brand)] text-white"
                  : "text-[var(--ink-soft)] hover:text-[var(--g-ink)] hover:bg-[color-mix(in_oklab,var(--g-brand)_10%,transparent)]",
              ].join(" ")}
            >
              {t(labelKey)}
            </a>
          ))}
        </div>
      </nav>

      <section
        id="section-family"
        className="border-b border-black/10 pb-10 pt-6"
      >
        <p className="section-kicker">OFFICIAL IDOL DIRECTORY</p>
        <h1 className="mt-5 max-w-5xl text-4xl font-semibold tracking-[-.045em] text-[var(--g-ink)] sm:text-6xl lg:text-7xl">
          {t("title")}
        </h1>
        <p className="mt-5 text-sm text-[var(--ink-soft)] sm:text-base">
          {t("lead")}
        </p>
      </section>

      <section id="section-groups">
        <div className="grid gap-4 sm:grid-cols-2">
          {(["sakamichi", "akb48g"] as Family[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => selectFamily(item)}
              onMouseEnter={() =>
                setPreview(item === "sakamichi" ? "nogizaka46" : "akb48")
              }
              onMouseLeave={clearPreview}
              className={`family-gate ${family === item ? "family-gate-active" : ""}`}
            >
              <span className="family-wordmark" aria-hidden="true">
                <b>{item === "sakamichi" ? "坂道" : "AKB48"}</b>
                <em>{item === "sakamichi" ? "SERIES" : "GROUP"}</em>
              </span>
              <strong>
                {item === "sakamichi"
                  ? tFranchise("sakamichiShort")
                  : tFranchise("akb48gShort")}
              </strong>
              <small>
                {groups.filter((g) => g.franchise === item).length} GROUPS
              </small>
            </button>
          ))}
        </div>
      </section>

      <section className="editorial-panel p-5 sm:p-7">
        <p className="section-kicker">01 · {t("groups")}</p>
        <h2 className="section-title mt-2">
          {family === "sakamichi"
            ? tFranchise("sakamichiShort")
            : tFranchise("akb48gShort")}
        </h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {familyGroups.map((group, i) => {
            const active = members.filter(
              (m) =>
                m.primaryGroupId === group.id &&
                (m.status === "active" || m.status === "graduating"),
            ).length;
            return (
              <div
                key={group.id}
                className="stagger-item min-w-0"
                style={{ "--i": Math.min(i, 20) } as React.CSSProperties}
              >
                <Link
                  href={`/g/${group.id}`}
                  onMouseEnter={() => setPreview(group.id)}
                  onMouseLeave={clearPreview}
                  className="group-tile block h-full w-full"
                >
                  <span className="text-[10px] uppercase tracking-[.14em] text-[var(--ink-soft)]">
                    {group.franchise === "sakamichi"
                      ? tFranchise("sakamichiShort")
                      : tFranchise("akb48gShort")}
                  </span>
                  <strong className="mt-5 block text-xl tracking-tight">
                    {localized(group.name)}
                  </strong>
                  <span className="mt-2 block text-xs text-[var(--ink-soft)]">
                    {tMember("statusActive")} {active} · {t("memberCountLabel")}{" "}
                    {
                      members.filter((m) => m.primaryGroupId === group.id)
                        .length
                    }
                  </span>
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      <section id="section-live">
        {([family] as Family[]).map((target) => {
          const events = eventsFor(target);
          return (
            <div
              key={`events-${target}`}
              className="editorial-panel p-5 sm:p-7 mb-6 last:mb-0"
            >
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="section-kicker">
                    {target === "sakamichi"
                      ? tFranchise("sakamichiShort")
                      : tFranchise("akb48gShort")}
                  </p>
                  <h2 className="section-title mt-2">{t("events")}</h2>
                  <p className="mt-2 text-xs text-[var(--ink-soft)]">
                    {t("updated")} · {portal.generatedAt}
                  </p>
                </div>
                <span className="count-pill">{events.length}</span>
              </div>
              {events.length ? (
                <Rail label={`${target} events`}>
                  {events.map((event, i) => {
                    const group = groupMap.get(event.groupIds[0] ?? "");
                    const venue = event.venueId
                      ? venues.get(event.venueId)
                      : undefined;
                    return (
                      <div
                        key={event.id}
                        className="stagger-item"
                        style={
                          { "--i": Math.min(i, 12) } as React.CSSProperties
                        }
                      >
                        <a
                          href={event.ticketUrl ?? event.officialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="event-poster-card group"
                          onMouseEnter={() => group && setPreview(group.id)}
                          onMouseLeave={clearPreview}
                        >
                          <div className="event-poster-media">
                            {event.posterUrl && !failedPosters.has(event.id) ? (
                              <img
                                src={event.posterUrl}
                                alt=""
                                loading="lazy"
                                referrerPolicy="no-referrer"
                                decoding="async"
                                className="h-full w-full object-cover"
                                onError={() =>
                                  setFailedPosters((current) => {
                                    const next = new Set(current);
                                    next.add(event.id);
                                    return next;
                                  })
                                }
                              />
                            ) : (
                              <div
                                className="event-poster-placeholder"
                                style={
                                  {
                                    "--event-color": group?.palette.brand,
                                  } as React.CSSProperties
                                }
                              >
                                <span>
                                  {group ? localized(group.shortName) : ""}
                                </span>
                                {group?.logoUrl && !failedEventLogos.has(group.id) ? (
                                  <img
                                    src={group.logoUrl}
                                    alt={`${localized(group.name)} logo`}
                                    loading="lazy"
                                    referrerPolicy="no-referrer"
                                    decoding="async"
                                    className="event-group-logo"
                                    onError={() =>
                                      setFailedEventLogos((current) => {
                                        const next = new Set(current);
                                        next.add(group.id);
                                        return next;
                                      })
                                    }
                                  />
                                ) : group ? (
                                  <strong className="event-group-wordmark">
                                    {localized(group.shortName)}
                                  </strong>
                                ) : null}
                                <b>LIVE</b>
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <time className="text-xs text-[var(--ink-soft)]">
                              {new Intl.DateTimeFormat(lang, {
                                month: "short",
                                day: "numeric",
                                weekday: "short",
                              }).format(new Date(event.startsAt))}
                            </time>
                            <h3 className="mt-2 line-clamp-2 text-sm font-semibold">
                              {localized(event.title)}
                            </h3>
                            <p className="mt-2 truncate text-xs text-[var(--ink-soft)]">
                              {venue
                                ? localized(venue.name)
                                : localized(
                                    group?.baseLocation ?? {
                                      ja: "オンライン",
                                      ko: "온라인",
                                      en: "Online",
                                    },
                                  )}{" "}
                              ↗
                            </p>
                          </div>
                        </a>
                      </div>
                    );
                  })}
                </Rail>
              ) : (
                <p className="mt-6 border-t border-black/10 py-8 text-sm text-[var(--ink-soft)]">
                  {t("emptyEvent")}
                </p>
              )}
            </div>
          );
        })}
      </section>

      <section id="section-birthdays" className="space-y-6">
        {([family] as Family[]).map((target) => {
          const {
            today: todayMembers,
            upcoming: upcomingMembers,
            past: pastMembers,
            total,
          } = birthdayBucketsFor(target);
          const buckets: {
            key: string;
            members: HomeMember[];
            label: string;
          }[] = [
            {
              key: "today",
              members: todayMembers,
              label: tBirthday("bucketToday"),
            },
            {
              key: "upcoming",
              members: upcomingMembers,
              label: tBirthday("bucketUpcoming"),
            },
            {
              key: "past",
              members: pastMembers,
              label: tBirthday("bucketPast"),
            },
          ];
          const nonEmpty = buckets.filter((b) => b.members.length > 0);
          let staggerOffset = 0;
          return (
            <div
              key={`birthday-${target}`}
              className="editorial-panel p-5 sm:p-7"
            >
              <p className="section-kicker">
                {target === "sakamichi"
                  ? tFranchise("sakamichiShort")
                  : tFranchise("akb48gShort")}
              </p>
              <h2 className="section-title mt-2">{t("birthdays")}</h2>
              {total > 0 ? (
                <Rail label={`${target} birthdays`}>
                  {nonEmpty.map((bucket, bucketIdx) => {
                    const startOffset = staggerOffset;
                    staggerOffset += bucket.members.length;
                    return (
                      <React.Fragment key={bucket.key}>
                        {bucketIdx > 0 && (
                          <div
                            className="birthday-bucket-divider"
                            role="separator"
                          >
                            <span>{bucket.label}</span>
                          </div>
                        )}
                        {bucket.members.map((member, i) => {
                          const group = groupMap.get(member.primaryGroupId);
                          const name =
                            lang === "ko"
                              ? member.name.ko.hangul
                              : lang === "en"
                                ? member.name.en.romaji
                                : member.name.ja.kanji;
                          return (
                            <div
                              key={member.id}
                              className="stagger-item"
                              style={
                                {
                                  "--i": Math.min(startOffset + i, 12),
                                } as React.CSSProperties
                              }
                            >
                              <Link
                                href={`/m/${member.id}`}
                                className="birthday-slide"
                                data-today={
                                  member.birthDate?.slice(5) === todayMd
                                    ? "true"
                                    : undefined
                                }
                              >
                                <MemberAvatar
                                  glyph={member.avatar.glyph}
                                  hueShift={member.avatar.hueShift}
                                  imageUrl={member.imageUrl}
                                  groupLogoUrl={group?.logoUrl ?? null}
                                  name={name}
                                  size={72}
                                />
                                <span className="mt-3 block font-semibold">
                                  {name}
                                </span>
                                <span className="mt-1 block text-[11px] text-[var(--ink-soft)]">
                                  {member.birthDate?.slice(5).replace("-", ".")}{" "}
                                  · {group?.shortName[lang]}
                                </span>
                              </Link>
                            </div>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </Rail>
              ) : (
                <p className="mt-5 text-sm text-[var(--ink-soft)]">
                  {t("emptyBirthday")}
                </p>
              )}
            </div>
          );
        })}
      </section>

      {/* Section 5 — YouTube channels rail (per franchise) */}
      <section id="section-youtube" className="space-y-6">
        {([family] as Family[]).map((target) => {
          const ytMembers = ytMembersFor(target);
          return (
            <div
              key={`yt-channels-${target}`}
              className="editorial-panel p-5 sm:p-7"
            >
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="section-kicker">
                    {target === "sakamichi"
                      ? tFranchise("sakamichiShort")
                      : tFranchise("akb48gShort")}
                  </p>
                  <h2 className="section-title mt-2 flex items-center gap-2">
                    <YouTubeIcon className="w-5 h-5 text-[#FF0000]" />
                    {t("youtubeChannels")}
                  </h2>
                </div>
                <span className="count-pill">{ytMembers.length}</span>
              </div>
              {ytMembers.length ? (
                <Rail label={`${target} youtube channels`}>
                  {ytMembers.map((member, i) => {
                    const group = groupMap.get(member.primaryGroupId);
                    const name = getMemberName(member);
                    const ytLink = member.links?.find(
                      (l) => l.type === "youtube" && l.status !== "dead",
                    );
                    return (
                      <div
                        key={member.id}
                        className="stagger-item"
                        style={
                          { "--i": Math.min(i, 12) } as React.CSSProperties
                        }
                      >
                        <a
                          href={ytLink?.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="channel-slide"
                          onMouseEnter={() => group && setPreview(group.id)}
                          onMouseLeave={clearPreview}
                        >
                          <div className="relative inline-block">
                            <MemberAvatar
                              glyph={member.avatar.glyph}
                              hueShift={member.avatar.hueShift}
                              imageUrl={member.imageUrl}
                              groupLogoUrl={group?.logoUrl ?? null}
                              name={name}
                              size={72}
                            />
                            <span className="absolute -bottom-1 -right-1 rounded-full bg-white p-[2px] shadow-sm">
                              <YouTubeIcon className="w-3.5 h-3.5 text-[#FF0000]" />
                            </span>
                          </div>
                          <span className="mt-3 block font-semibold text-[13px]">
                            {name}
                          </span>
                          <span className="mt-1 block text-[11px] text-[var(--ink-soft)]">
                            {group?.shortName[lang]}
                          </span>
                        </a>
                      </div>
                    );
                  })}
                </Rail>
              ) : (
                <p className="mt-5 text-sm text-[var(--ink-soft)]">
                  {t("emptyChannels")}
                </p>
              )}
            </div>
          );
        })}
      </section>

      {/* Section 6 — YouTube latest videos rail (per franchise, up to 20) */}
      <section className="space-y-6">
        {([family] as Family[]).map((target) => {
          const ytVideos = ytVideosFor(target);
          return (
            <div
              key={`yt-videos-${target}`}
              className="editorial-panel p-5 sm:p-7"
            >
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="section-kicker">
                    {target === "sakamichi"
                      ? tFranchise("sakamichiShort")
                      : tFranchise("akb48gShort")}
                  </p>
                  <h2 className="section-title mt-2 flex items-center gap-2">
                    <YouTubeIcon className="w-5 h-5 text-[#FF0000]" />
                    {t("youtubeVideos")}
                  </h2>
                </div>
                <span className="count-pill">{ytVideos.length}</span>
              </div>
              {ytVideos.length ? (
                <Rail label={`${target} youtube videos`}>
                  {ytVideos.map((video, i) => {
                    const group = groupMap.get(video.groupId);
                    return (
                      <div
                        key={video.id}
                        className="stagger-item"
                        style={
                          { "--i": Math.min(i, 12) } as React.CSSProperties
                        }
                      >
                        <a
                          href={video.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="video-card"
                          onMouseEnter={() => group && setPreview(group.id)}
                          onMouseLeave={clearPreview}
                        >
                          <div className="video-card-media">
                            <img
                              src={video.thumbnailUrl}
                              alt=""
                              loading="lazy"
                              decoding="async"
                            />
                          </div>
                          <div className="video-card-body">
                            <p className="video-card-title">{video.title}</p>
                            <div className="video-card-meta">
                              <span>{video.memberName[lang]}</span>
                              <span>·</span>
                              <time>
                                {new Intl.DateTimeFormat(lang, {
                                  month: "short",
                                  day: "numeric",
                                }).format(new Date(video.publishedAt))}
                              </time>
                            </div>
                          </div>
                        </a>
                      </div>
                    );
                  })}
                </Rail>
              ) : (
                <p className="mt-5 text-sm text-[var(--ink-soft)]">
                  {t("emptyVideos")}
                </p>
              )}
            </div>
          );
        })}
      </section>

      {/* Section 7 — TikTok channels rail (per franchise) */}
      <section id="section-tiktok" className="space-y-6">
        {([family] as Family[]).map((target) => {
          const ttMembers = ttMembersFor(target);
          return (
            <div
              key={`tt-channels-${target}`}
              className="editorial-panel p-5 sm:p-7"
            >
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="section-kicker">
                    {target === "sakamichi"
                      ? tFranchise("sakamichiShort")
                      : tFranchise("akb48gShort")}
                  </p>
                  <h2 className="section-title mt-2 flex items-center gap-2">
                    <TikTokIcon className="w-5 h-5" />
                    {t("tiktokChannels")}
                  </h2>
                </div>
                <span className="count-pill">{ttMembers.length}</span>
              </div>
              {ttMembers.length ? (
                <Rail label={`${target} tiktok channels`}>
                  {ttMembers.map((member, i) => {
                    const group = groupMap.get(member.primaryGroupId);
                    const name = getMemberName(member);
                    const ttLink = member.links?.find(
                      (l) => l.type === "tiktok" && l.status !== "dead",
                    );
                    return (
                      <div
                        key={member.id}
                        className="stagger-item"
                        style={
                          { "--i": Math.min(i, 12) } as React.CSSProperties
                        }
                      >
                        <a
                          href={ttLink?.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="channel-slide"
                          onMouseEnter={() => group && setPreview(group.id)}
                          onMouseLeave={clearPreview}
                        >
                          <div className="relative inline-block">
                            <MemberAvatar
                              glyph={member.avatar.glyph}
                              hueShift={member.avatar.hueShift}
                              imageUrl={null}
                              groupLogoUrl={group?.logoUrl ?? null}
                              name={name}
                              size={72}
                            />
                            <span className="absolute -bottom-1 -right-1 rounded-full bg-white p-[2px] shadow-sm">
                              <TikTokIcon className="w-3.5 h-3.5" />
                            </span>
                          </div>
                          <span className="mt-3 block font-semibold text-[13px]">
                            {name}
                          </span>
                          <span className="mt-1 block text-[11px] text-[var(--ink-soft)]">
                            {group?.shortName[lang]}
                          </span>
                        </a>
                      </div>
                    );
                  })}
                </Rail>
              ) : (
                <p className="mt-5 text-sm text-[var(--ink-soft)]">
                  {t("emptyChannels")}
                </p>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
