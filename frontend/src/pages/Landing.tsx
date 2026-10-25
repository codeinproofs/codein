import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import XLink from "@/components/XLink";

gsap.registerPlugin(ScrollTrigger);

function LandArrow() {
  return (
    <span className="land-btn-arrow" aria-hidden>
      <svg viewBox="0 0 16 16" fill="none">
        <path
          d="M3 8h10M9 4l4 4-4 4"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

const STEPS = [
  {
    n: "01",
    title: "Draft",
    body: "Describe any app in one line. AI names it, picks a ticker, and paints a minimal icon before a single coin is minted.",
  },
  {
    n: "02",
    title: "Confirm",
    body: "Review name, ticker, and description. Nothing launches until you hit confirm. Honest preview, not silent auto-mint.",
  },
  {
    n: "03",
    title: "Launch",
    body: "The coin goes live on pump.fun while the codebase streams into your workspace, file by file, status by status.",
  },
  {
    n: "04",
    title: "Ship",
    body: "Watch building → reviewing → shipped. Deploy URL and mint address land in the status bar when the pipeline finishes.",
  },
];

const PILLARS = [
  {
    title: "Terminal-native",
    text: "A CLI that feels like home for builders, with a real confirm gate before any on-chain action.",
  },
  {
    title: "Coin + code",
    text: "One idea becomes a token and a full scaffold. Speculation meets shipping, in the same flow.",
  },
  {
    title: "Live by design",
    text: "SSE streams every file as it lands. You don't wait for a zip. You watch the product assemble.",
  },
];

const FACTS = [
  { k: "Launch fee", v: "Free" },
  { k: "Fee split", v: "30 / 70" },
  { k: "AI", v: "GPT-4o + DALL·E" },
  { k: "Chain", v: "Solana · pump.fun" },
];

export default function Landing() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      gsap.from(".land-nav", { y: -24, opacity: 0, duration: 1, ease: "power3.out" });
      gsap.from(".land-hero-copy > *", {
        y: 40,
        opacity: 0,
        duration: 1.1,
        stagger: 0.12,
        ease: "power3.out",
        delay: 0.15,
      });
      gsap.from(".land-scroll", {
        opacity: 0,
        y: -8,
        duration: 1,
        delay: 1.2,
        ease: "power2.out",
      });

      if (!reduced) {
        gsap.to(".land-scroll-dot", {
          y: 10,
          opacity: 0.15,
          duration: 1.4,
          ease: "power1.inOut",
          repeat: -1,
          yoyo: true,
        });
        gsap.to(".land-scroll", {
          y: 6,
          duration: 2.2,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });

        gsap.to(".land-video", {
          scale: 1.12,
          ease: "none",
          scrollTrigger: {
            trigger: ".land-hero",
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });

        gsap.utils.toArray<HTMLElement>(".land-reveal").forEach((el) => {
          gsap.from(el, {
            y: 56,
            opacity: 0,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          });
        });

        gsap.utils.toArray<HTMLElement>(".land-step").forEach((el, i) => {
          gsap.from(el, {
            x: i % 2 === 0 ? -48 : 48,
            opacity: 0,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
          });
        });

        // Ghost section titles: soft reveal + cinematic parallax
        gsap.utils.toArray<HTMLElement>(".land-bleed-type").forEach((el) => {
          const section = el.closest("section") ?? el.parentElement;
          if (!section) return;
          const side = el.dataset.bleed ?? "left";
          const xDrift = side === "right" ? 40 : side === "center" ? 0 : -40;
          const xPercent = side === "center" ? -50 : 0;
          const yPercent = el.dataset.bleedY === "center" ? -50 : 0;

          gsap.set(el, { xPercent, yPercent });

          gsap.fromTo(
            el,
            { opacity: 0, scale: 1.045, filter: "blur(8px)" },
            {
              opacity: 0.055,
              scale: 1,
              filter: "blur(0px)",
              duration: 1.4,
              ease: "power3.out",
              scrollTrigger: {
                trigger: section,
                start: "top 80%",
                toggleActions: "play none none reverse",
              },
            },
          );

          gsap.fromTo(
            el,
            {
              y: 64,
              x: side === "right" ? -24 : side === "left" ? 24 : 0,
              xPercent,
              yPercent,
            },
            {
              y: -72,
              x: xDrift,
              xPercent,
              yPercent,
              ease: "none",
              scrollTrigger: {
                trigger: section,
                start: "top bottom",
                end: "bottom top",
                scrub: 1.15,
              },
            },
          );
        });
      } else {
        gsap.set(".land-bleed-type", { opacity: 0.055 });
      }
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="land relative min-h-screen">
      {/* Fixed cinematic video layer */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <video
          className="land-video absolute left-1/2 top-1/2 min-h-full min-w-full -translate-x-1/2 -translate-y-1/2 scale-105 object-cover"
          style={{
            filter: "saturate(0.5) contrast(1.12) brightness(0.48) hue-rotate(200deg)",
          }}
          autoPlay
          muted
          loop
          playsInline
        >
          <source src="/media/hero.mp4" type="video/mp4" />
        </video>
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(7,7,11,0.5) 0%, rgba(7,7,11,0.72) 48%, rgba(7,7,11,0.94) 100%)",
          }}
        />
        <div
          className="absolute inset-0 mix-blend-overlay opacity-60"
          style={{
            background:
              "radial-gradient(ellipse at 28% 18%, rgba(59,130,246,0.22), transparent 52%), radial-gradient(ellipse at 78% 62%, rgba(139,92,246,0.16), transparent 48%)",
          }}
        />
      </div>

      <div className="relative z-10">
        <nav className="land-nav fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 py-5 md:px-10">
          <span className="land-brand">
            Code<span>In</span>
          </span>
          <div className="flex items-center gap-3 md:gap-4">
            <a href="#how" className="land-nav-link hidden md:inline">
              How it works
            </a>
            <XLink variant="nav" />
            <Link to="/app" className="land-btn land-btn-ghost land-btn-sm">
              <span className="land-btn-label">Open workspace</span>
              <LandArrow />
            </Link>
          </div>
        </nav>

        {/* HERO */}
        <section className="land-hero relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pb-24 pt-28 text-center md:px-10">
          <p
            className="land-bleed-type -left-[6%] top-[16%] hidden md:block"
            data-bleed="left"
            aria-hidden
          >
            CODEIN
          </p>
          <div className="land-hero-copy relative z-[1] mx-auto max-w-4xl">
            <p className="land-eyebrow mb-7">Invent · Mint · Ship</p>
            <h1 className="land-h1">
              Type an app.
              <br />
              <span className="land-h1-sub">Launch its coin.</span>
            </h1>
            <p className="land-body mx-auto mt-7 max-w-lg">
              The launch platform for builders who ship in public. One command drafts the product,
              confirms the mint, and streams the codebase live in a workspace that feels like an IDE.
            </p>
            <div className="mt-11 flex flex-wrap items-center justify-center gap-3.5">
              <Link to="/app" className="land-btn land-btn-primary">
                <span className="land-btn-label">Enter CodeIn</span>
                <LandArrow />
              </Link>
              <a href="#story" className="land-btn land-btn-ghost">
                <span className="land-btn-label">Read the story</span>
              </a>
            </div>
          </div>

          <a
            href="#story"
            aria-label="Scroll to content"
            className="land-scroll absolute bottom-10 left-1/2 flex -translate-x-1/2 flex-col items-center opacity-60 transition hover:opacity-100"
          >
            <span className="relative flex h-9 w-[22px] items-start justify-center rounded-full border border-[rgba(232,233,237,0.28)] pt-1.5">
              <span className="land-scroll-dot block h-1.5 w-1 rounded-full bg-[rgba(232,233,237,0.75)]" />
            </span>
          </a>
        </section>

        {/* STORY */}
        <section id="story" className="relative overflow-hidden px-6 py-28 md:px-10">
          <p
            className="land-bleed-type -right-[4%] top-6 md:top-10"
            data-bleed="right"
            aria-hidden
          >
            WHY
          </p>
          <div className="land-reveal land-card relative z-[1] mx-auto max-w-3xl rounded-[28px] p-8 md:p-12">
            <p className="land-eyebrow">Why CodeIn</p>
            <h2 className="land-h2 mt-5">
              Not another form.
              <br />
              A launch ritual.
            </h2>
            <p className="land-body mt-6 max-w-2xl">
              Most launch tools hide the hard parts behind dashboards. CodeIn keeps the energy of a
              terminal, then adds the one thing crypto launches need: an explicit confirm before mint.
              You see the name, the ticker, the story. Then you ship.
            </p>
            <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
              {FACTS.map((f) => (
                <div
                  key={f.k}
                  className="rounded-2xl border border-[rgba(232,233,237,0.08)] bg-[rgba(232,233,237,0.03)] px-4 py-4"
                >
                  <p className="land-eyebrow !text-[0.625rem] opacity-70">{f.k}</p>
                  <p className="land-stat mt-2">{f.v}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PILLARS */}
        <section className="relative overflow-hidden px-6 py-16 md:px-10">
          <p
            className="land-bleed-type -left-[3%] top-1/2"
            data-bleed="left"
            data-bleed-y="center"
            aria-hidden
          >
            BUILD
          </p>
          <div className="relative z-[1] mx-auto grid max-w-5xl gap-4 md:grid-cols-3 md:gap-5">
            {PILLARS.map((p) => (
              <article key={p.title} className="land-reveal land-card rounded-[24px] p-7">
                <h3 className="land-h3">{p.title}</h3>
                <p className="land-body-sm mt-3">{p.text}</p>
              </article>
            ))}
          </div>
        </section>

        {/* HOW */}
        <section id="how" className="relative overflow-hidden px-6 py-28 md:px-10">
          <p
            className="land-bleed-type left-1/2 top-8 md:top-12"
            data-bleed="center"
            aria-hidden
          >
            FLOW
          </p>
          <div className="land-reveal relative z-[1] mx-auto mb-14 max-w-3xl text-center">
            <p className="land-eyebrow">Pipeline</p>
            <h2 className="land-h2 mt-4">Four beats. One flow.</h2>
          </div>
          <div className="relative z-[1] mx-auto flex max-w-3xl flex-col gap-4 md:gap-5">
            {STEPS.map((s) => (
              <div
                key={s.n}
                className="land-step land-card flex gap-5 rounded-[24px] p-6 md:gap-8 md:p-8"
              >
                <span className="land-mono shrink-0 pt-1 text-[0.8125rem] !text-[#7aa2ff]">
                  {s.n}
                </span>
                <div>
                  <h3 className="land-h3">{s.title}</h3>
                  <p className="land-body-sm mt-2">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* WORKSPACE TEASER */}
        <section className="relative overflow-hidden px-6 py-20 md:px-10">
          <p
            className="land-bleed-type -left-[2%] -top-2 md:top-0"
            data-bleed="left"
            aria-hidden
          >
            IDE
          </p>
          <div className="land-reveal land-card relative z-[1] mx-auto max-w-5xl overflow-hidden rounded-[28px]">
            <div className="flex items-center gap-2 border-b border-[rgba(232,233,237,0.08)] px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]/80" />
              <span className="land-mono ml-3">codein / workspace</span>
            </div>
            <div className="grid md:grid-cols-[200px_1fr]">
              <div className="land-mono hidden border-r border-[rgba(232,233,237,0.08)] p-4 md:block">
                <p className="land-eyebrow mb-3 !text-[0.6rem]">Explorer</p>
                <p className="!text-[var(--land-ink-soft)]">LAUNCHES</p>
                <p className="mt-1 pl-2 opacity-70">create-dog.app</p>
                <p className="pl-2 opacity-70">pumpcord.app</p>
                <p className="mt-4 !text-[var(--land-ink-soft)]">START FROM</p>
                <p className="mt-1 pl-2 opacity-70">discord.like</p>
                <p className="pl-2 opacity-70">chrome.like</p>
              </div>
              <div className="p-6 md:p-10">
                <p className="land-mono">
                  {"// "}create: describe any app, launch its coin, get the source
                </p>
                <h2 className="land-h2 mt-6 !text-[clamp(1.75rem,3.5vw,2.5rem)]">
                  Tabs. Confirm. Stream.
                </h2>
                <p className="land-body-sm mt-4 max-w-lg">
                  Close the home tab and the workspace stays. Reopen it when you are ready to type the
                  next idea. IDE chrome for a launch ritual that still feels like code.
                </p>
                <Link to="/app" className="land-btn land-btn-accent mt-8">
                  <span className="land-btn-label">Launch the workspace</span>
                  <LandArrow />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="relative overflow-hidden px-6 py-32 md:px-10">
          <p
            className="land-bleed-type left-1/2 top-1/2"
            data-bleed="center"
            data-bleed-y="center"
            aria-hidden
          >
            ENTER
          </p>
          <div className="land-reveal relative z-[1] mx-auto flex max-w-2xl flex-col items-center text-center">
            <h2 className="land-h2 w-full text-center">Ready when you are.</h2>
            <p className="land-body mt-5 max-w-md text-center">
              Connect a wallet inside the app, type your idea, confirm the coin, and watch it build.
            </p>
            <Link to="/app" className="land-btn land-btn-primary mt-10">
              <span className="land-btn-label">Enter CodeIn</span>
              <LandArrow />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
