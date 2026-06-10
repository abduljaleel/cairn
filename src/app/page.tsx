import Link from "next/link";
import type { CSSProperties } from "react";
import { appConfig } from "@/lib/config";
import LandingMotion from "./landing-motion";

const ACCENT = "#5e7cff";
const MONO =
  "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace";

// All motion lives here, double-gated: every rule sits inside
// prefers-reduced-motion: no-preference, and the scroll reveals additionally
// require .motion-ready (added by LandingMotion only when motion is allowed).
// NOTE: this CSS is a React text child, so it must avoid < > & and quotes.
const landingCss = `
.spine-node{display:block;width:11px;height:11px;border-radius:999px;background:#0b0d10;border:2px solid #2b2f3a;transition:background .25s ease,border-color .25s ease,transform .5s ease;}
.spine-node-active{width:13px;height:13px;background:#5e7cff;border-color:#5e7cff;box-shadow:0 0 18px #5e7cff,0 0 4px #5e7cff;}
.stone-row:hover .spine-node{background:#5e7cff;border-color:#5e7cff;}
.stone-connector{background:#2a2f3b;transition:background .25s ease;}
.stone-connector-active{background:#5e7cff;}
.stone-row:hover .stone-connector{background:#5e7cff;}
.stone-card{border-color:#1a1e26;transition:border-color .25s ease,box-shadow .25s ease;}
.stone-card:hover{border-color:#2e3442;}
.stone-card-active{border-color:#5e7cff;box-shadow:0 0 34px rgba(94,124,255,.2);}
.stone-card-active:hover{border-color:#5e7cff;}
.cta-primary{background:#5e7cff;color:#0b0d10;border:1px solid #5e7cff;box-shadow:0 0 22px rgba(94,124,255,.27);transition:background .2s ease,border-color .2s ease,box-shadow .2s ease;}
.cta-primary:hover{background:#7d95ff;border-color:#7d95ff;color:#0b0d10;box-shadow:0 0 28px rgba(94,124,255,.33);}
.cta-primary:focus-visible{outline:2px solid #5e7cff;outline-offset:3px;}
.cta-outline{border:1px solid rgba(94,124,255,.45);color:#5e7cff;transition:background .2s ease,color .2s ease,border-color .2s ease,box-shadow .2s ease;}
.cta-outline:hover{background:#5e7cff;color:#0b0d10;border-color:#5e7cff;box-shadow:0 0 28px rgba(94,124,255,.33);}
.cta-outline:focus-visible{outline:2px solid #5e7cff;outline-offset:3px;}
.cta-ghost{color:#8a92a6;transition:color .2s ease;}
.cta-ghost:hover{color:#ffffff;}
.cta-ghost:focus-visible{outline:2px solid #5e7cff;outline-offset:3px;}
.type-wrap{display:flex;align-items:center;min-width:0;}
.type-text{display:inline-block;overflow:hidden;white-space:nowrap;max-width:100%;}
.type-caret{display:inline-block;flex:none;width:7px;height:15px;margin-left:3px;background:#5e7cff;}
@media (prefers-reduced-motion: no-preference){
  html{scroll-behavior:smooth;}
  .spine-line{transform-origin:top;animation:cairnSpine 1.2s cubic-bezier(.22,.61,.36,1) both;}
  .hero-fade{animation:cairnRise .7s ease both;}
  .spine-node-active{animation:cairnPulse 2.5s ease-in-out infinite;}
  .motion-ready [data-reveal]{opacity:0;transform:translateY(8px);transition:opacity .55s ease,transform .55s ease;transition-delay:var(--rd,0ms);}
  .motion-ready [data-reveal].is-in{opacity:1;transform:translateY(0);}
  .motion-ready .stone-row .spine-node{transform:scale(.4);}
  .motion-ready .stone-row.is-in .spine-node{transform:scale(1);}
  .motion-ready .qsec .type-text{width:0;}
  .motion-ready .qsec.is-in .type-text{animation:cairnType 1.5s steps(33) .15s forwards;}
  .motion-ready .qsec.is-in .type-caret{animation:cairnBlink 1.1s linear infinite;}
  .motion-ready .qsec .q-hop,.motion-ready .qsec .q-root{opacity:0;}
  .motion-ready .qsec.is-in .q-hop,.motion-ready .qsec.is-in .q-root{animation:cairnRise .45s ease forwards;animation-delay:var(--hd,1.8s);}
}
@keyframes cairnSpine{from{transform:scaleY(0);}to{transform:scaleY(1);}}
@keyframes cairnRise{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
@keyframes cairnType{from{width:0;}to{width:33ch;}}
@keyframes cairnBlink{0%,55%{opacity:1;}56%,100%{opacity:0;}}
@keyframes cairnPulse{0%,100%{box-shadow:0 0 18px #5e7cff,0 0 4px #5e7cff;}50%{box-shadow:0 0 32px rgba(94,124,255,.9),0 0 8px #5e7cff;}}
`;

type Stone = {
  ts: string;
  stageLabel: string;
  agent: string;
  change: string;
  model: string;
  constraints: number;
  rationale: string;
  active?: boolean;
};

// The chain reads top -> bottom:
// User intent -> Plan -> File decision -> Constraint check -> Edit -> Verified
const stones: Stone[] = [
  {
    ts: "14:22:51 UTC",
    stageLabel: "User intent",
    agent: "intent.parser",
    change: "inbound: “add SSO to the auth module”",
    model: "haiku-3.5",
    constraints: 0,
    rationale: "Resolved a free-text request into a scoped engineering goal.",
  },
  {
    ts: "14:22:58 UTC",
    stageLabel: "Plan",
    agent: "strategy-planner",
    change: "PLAN.md  +  4-step decomposition",
    model: "opus-4.7",
    constraints: 1,
    rationale: "Limited blast radius to src/auth/* before any file was touched.",
  },
  {
    ts: "14:23:02 UTC",
    stageLabel: "File decision",
    agent: "refactor-bot",
    change: "src/auth/sso.ts  ·  chose NEW over patch",
    model: "sonnet-4.6",
    constraints: 2,
    rationale:
      "Rejected mutating session.ts — its JWT interface has 6 downstream callers.",
  },
  {
    ts: "14:23:05 UTC",
    stageLabel: "Constraint check",
    agent: "guardrail.gate",
    change: "policy/pii.never.logged  →  PASS",
    model: "haiku-3.5",
    constraints: 2,
    rationale: "Verified the planned diff writes no PII to any log sink.",
  },
  {
    ts: "14:23:07 UTC",
    stageLabel: "Edit",
    agent: "refactor-bot",
    change: "src/auth/sso.ts  +148 / −0",
    model: "sonnet-4.6",
    constraints: 2,
    rationale: "Wrote a SAML assertion parser. Preserved the JWT contract intact.",
    active: true,
  },
  {
    ts: "14:23:14 UTC",
    stageLabel: "Verified",
    agent: "verifier",
    change: "src/auth/sso.test.ts  ·  12/12 pass",
    model: "sonnet-4.6",
    constraints: 1,
    rationale:
      "Malformed assertion returns null rather than throwing. Chain sealed.",
  },
];

const manifest: [string, string][] = [
  ["session", "41a7"],
  ["events", "6"],
  ["span", "23s"],
  ["models", "3"],
  ["seal", "a41c…9f2e ✓"],
];

function StackGlyph({ size = 22 }: { size?: number }) {
  // Three rounded stones stacked - a cairn
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
    >
      <rect x="6.5" y="3" width="11" height="4.4" rx="2.2" fill={ACCENT} fillOpacity="0.55" />
      <rect x="4" y="9.2" width="16" height="5" rx="2.5" fill={ACCENT} fillOpacity="0.8" />
      <rect x="6" y="16.4" width="12" height="4.6" rx="2.3" fill={ACCENT} />
    </svg>
  );
}

function Node({ active }: { active?: boolean }) {
  return (
    <span
      className={active ? "spine-node spine-node-active" : "spine-node"}
      aria-hidden="true"
    />
  );
}

function StoneCard({ s, side }: { s: Stone; side: "left" | "right" }) {
  return (
    <article
      aria-label={`${s.stageLabel} — ${s.ts}`}
      className={`stone-card relative z-[3] border bg-[#0d1015] px-4 py-3.5${
        s.active ? " stone-card-active" : ""
      }`}
      style={{
        borderRadius:
          side === "left" ? "13px 5px 13px 13px" : "5px 13px 13px 13px",
      }}
    >
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span
          className="whitespace-nowrap text-[11px] uppercase tracking-[0.18em]"
          style={{ color: s.active ? ACCENT : "#7c8498", fontFamily: MONO }}
        >
          {s.ts}
        </span>
        <span
          className="whitespace-nowrap text-[11px] uppercase tracking-[0.18em]"
          style={{
            color: "#9aa3b8",
            fontFamily: MONO,
            border: `1px solid ${s.active ? `${ACCENT}66` : "#272c38"}`,
            padding: "1px 7px",
            borderRadius: 999,
            background: s.active ? `${ACCENT}14` : "transparent",
          }}
        >
          {s.stageLabel}
        </span>
      </div>

      <div className="mt-2 text-[13px] text-white" style={{ fontFamily: MONO }}>
        {s.change}
      </div>

      <div
        className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-[#8a92a6]"
        style={{ fontFamily: MONO }}
      >
        <span>{s.agent}</span>
        <span>model: {s.model}</span>
        <span>
          constraints: <span style={{ color: ACCENT }}>{s.constraints}</span>
        </span>
      </div>

      <p
        className="mt-2 text-[12.5px] italic leading-relaxed text-[#aab2c6]"
        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
      >
        {s.rationale}
      </p>
    </article>
  );
}

export default function LandingPage() {
  return (
    <main
      id="cairn-landing"
      className="min-h-screen bg-[#0b0d10] text-[#c5ccda] antialiased"
      style={{
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
      }}
    >
      <style>{landingCss}</style>
      <LandingMotion />

      {/* ============================================================
          TOP BAR - brand lockup left, auth right
      ============================================================ */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 pt-5 pb-1 sm:px-8 sm:pt-7 sm:pb-2">
        <div className="flex items-center gap-2.5">
          <StackGlyph size={22} />
          <span
            className="text-[15px] font-semibold uppercase tracking-[0.06em] text-white"
            style={{ fontFamily: MONO }}
          >
            {appConfig.name}
          </span>
          <span
            className="hidden text-[11px] uppercase tracking-[0.28em] text-[#7c8498] sm:inline"
            style={{ fontFamily: MONO }}
          >
            London
          </span>
        </div>
        <div
          className="flex items-center gap-3 text-[12px] sm:gap-4"
          style={{ fontFamily: MONO }}
        >
          <Link href="/login" className="cta-ghost px-2 py-3.5 sm:py-1.5">
            sign in
          </Link>
          <Link
            href="/signup"
            className="cta-outline px-3.5 py-3.5 sm:py-1.5"
          >
            get started
          </Link>
        </div>
      </header>

      {/* ============================================================
          THE SPINE - one vertical line, the full length of the page.
          Intro, stones, query, and close all hang off it. The spine
          sits at the left-third on desktop; stones alternate to its
          right / cross over to its left.
      ============================================================ */}
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="relative">
          {/* the literal spine line (draws downward on load) */}
          <div
            aria-hidden="true"
            className="spine-line absolute top-0 bottom-0 left-[18px] w-px sm:left-[33%]"
            style={{
              background:
                "linear-gradient(180deg, transparent 0, #2a2f3b 64px, #2a2f3b calc(100% - 120px), transparent 100%)",
            }}
          />
          {/* faint glow rail tracking the full active region of the spine */}
          <div
            aria-hidden="true"
            className="absolute left-[17px] top-[64px] bottom-[140px] w-[3px] sm:left-[calc(33%-1px)]"
            style={{
              background: `linear-gradient(180deg, transparent, ${ACCENT}20, ${ACCENT}20, transparent)`,
              filter: "blur(3px)",
            }}
          />

          {/* ---- INTRO at the head of the spine ---- */}
          <section className="relative pt-10 pb-12 pl-12 sm:pt-12 sm:pl-[calc(33%+2.5rem)]">
            {/* session manifest in the left rail — the ledger's header record */}
            <aside
              aria-label="Session manifest"
              className="hero-fade absolute left-0 top-16 hidden w-[calc(33%-2.5rem)] sm:block"
              style={{ fontFamily: MONO, animationDelay: ".45s" }}
            >
              <dl className="space-y-1.5 text-[11px]">
                {manifest.map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-baseline justify-end gap-3"
                  >
                    <dt className="uppercase tracking-[0.18em] text-[#7c8498]">
                      {key}
                    </dt>
                    <dd className="text-[#c5ccda]">{value}</dd>
                  </div>
                ))}
              </dl>
            </aside>

            <p
              className="hero-fade text-[11px] uppercase tracking-[0.3em]"
              style={{ color: ACCENT, fontFamily: MONO, animationDelay: ".05s" }}
            >
              <span className="sm:hidden">./provenance &mdash; sealed</span>
              <span className="hidden sm:inline">
                ./provenance &mdash; session 41a7 &mdash; sealed
              </span>
            </p>
            <h1
              className="hero-fade mt-4 max-w-xl text-[30px] font-medium leading-[1.15] tracking-[-0.01em] text-white sm:text-[42px]"
              style={{ animationDelay: ".12s" }}
            >
              Every change an agent makes, recorded as a stone on the path.
            </h1>
            <p
              className="hero-fade mt-5 max-w-md text-[15px] leading-relaxed text-[#8b93a7]"
              style={{ animationDelay: ".2s" }}
            >
              Query the chain six months later and the answer is still there. A
              causal provenance graph for every agent decision.
            </p>
            <p
              className="hero-fade mt-4 max-w-md border-l pl-3 text-[13px] italic text-[#8a92a6]"
              style={{
                borderColor: `${ACCENT}66`,
                fontFamily: "Georgia, serif",
                animationDelay: ".28s",
              }}
            >
              &ldquo;Why did the AI change that file? Nobody knows.&rdquo; &mdash; until now.
            </p>
            <div
              className="hero-fade mt-7 flex flex-wrap items-center gap-x-5 gap-y-3"
              style={{ animationDelay: ".36s" }}
            >
              <Link
                href="/signup"
                className="cta-primary inline-flex items-center gap-2 rounded-lg px-5 py-3.5 text-[13px] font-semibold sm:py-3"
                style={{ fontFamily: MONO }}
              >
                $ cairn record &rarr;
              </Link>
              <a
                href="#chain"
                className="cta-ghost inline-flex items-center gap-1.5 px-1 py-3.5 text-[13px] sm:py-3"
                style={{ fontFamily: MONO }}
              >
                see the chain &darr;
              </a>
            </div>
          </section>

          {/* ---- THE CHAIN OF STONES (alternating left / right) ---- */}
          <section id="chain" className="relative scroll-mt-6">
            <h2
              className="pb-5 pl-12 text-[11px] uppercase tracking-[0.28em] text-[#7c8498] sm:pl-[calc(33%+2.5rem)]"
              style={{ fontFamily: MONO }}
            >
              <span className="sm:hidden">the chain</span>
              <span className="hidden sm:inline">
                the chain &mdash; six events, one path
              </span>
            </h2>

            {stones.map((s, idx) => {
              const side: "left" | "right" = idx % 2 === 0 ? "right" : "left";
              return (
                <div
                  key={s.ts}
                  data-reveal
                  className={`stone-row relative py-1.5${
                    idx > 0 ? " sm:-mt-10" : ""
                  }`}
                  style={{ "--rd": `${(idx % 3) * 80}ms` } as CSSProperties}
                >
                  {/* node on the spine */}
                  <div
                    className="absolute left-[18px] top-[18px] z-[2] -translate-x-1/2 sm:left-[33%]"
                  >
                    <Node active={s.active} />
                  </div>

                  {/* MOBILE: everything to the right of the spine */}
                  <div className="pl-12 sm:hidden">
                    <div
                      aria-hidden="true"
                      className={`stone-connector${
                        s.active ? " stone-connector-active" : ""
                      } absolute left-[18px] top-[22px] h-px w-[30px]`}
                    />
                    <StoneCard s={s} side="right" />
                  </div>

                  {/* DESKTOP: alternate sides of the spine, interlocked */}
                  <div className="hidden sm:block">
                    {side === "right" ? (
                      <div className="ml-[33%] pl-10">
                        <div
                          aria-hidden="true"
                          className={`stone-connector${
                            s.active ? " stone-connector-active" : ""
                          } absolute left-[33%] top-[22px] h-px w-10`}
                        />
                        <div className="max-w-md">
                          <StoneCard s={s} side="right" />
                        </div>
                      </div>
                    ) : (
                      <div className="mr-[67%] flex justify-end pr-10">
                        <div
                          aria-hidden="true"
                          className={`stone-connector${
                            s.active ? " stone-connector-active" : ""
                          } absolute right-[67%] top-[22px] h-px w-10`}
                        />
                        <div className="w-full max-w-md">
                          <StoneCard s={s} side="left" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </section>

          {/* ---- SEAL: divider record between the stones and the query ---- */}
          <div data-reveal className="relative py-9">
            <div
              aria-hidden="true"
              className="absolute left-[18px] top-1/2 h-px w-[26px] -translate-x-1/2 bg-[#2e3442] sm:left-[33%]"
            />
            <p
              className="whitespace-nowrap pl-12 text-[11px] tracking-[0.08em] text-[#7c8498] sm:pl-[calc(33%+2.5rem)] sm:tracking-[0.22em]"
              style={{ fontFamily: MONO }}
            >
              chain sealed &middot; 6 events &middot; 23s elapsed
            </p>
          </div>

          {/* ---- QUERY AFFORDANCE near the base of the spine ---- */}
          <section
            data-reveal
            className="qsec relative pt-4 pb-4 pl-12 sm:pl-[calc(33%+2.5rem)]"
          >
            <div className="absolute left-[18px] top-[61px] -translate-x-1/2 sm:left-[33%]">
              <Node />
            </div>
            <div
              aria-hidden="true"
              className="stone-connector absolute left-[18px] top-[66px] h-px w-[30px] sm:left-[33%] sm:w-10"
            />

            <h2
              className="mb-3 text-[11px] uppercase tracking-[0.28em] text-[#8a92a6]"
              style={{ fontFamily: MONO }}
            >
              replay the chain
            </h2>

            {/* faux search bar — types itself out when it enters the viewport */}
            <div
              className="flex items-center gap-3 border bg-[#0d1015] px-4 py-3"
              style={{ borderColor: "#222733", borderRadius: 10 }}
            >
              <span style={{ color: ACCENT, fontFamily: MONO }} className="text-sm">
                ask
              </span>
              <span
                className="type-wrap flex-1 text-[11px] text-[#aab2c6] sm:text-[13px]"
                style={{ fontFamily: MONO }}
              >
                <span className="type-text">
                  why did auth.ts change on Monday?
                </span>
                <span className="type-caret" aria-hidden="true" />
              </span>
              <span
                className="hidden whitespace-nowrap text-[11px] uppercase tracking-[0.2em] text-[#7c8498] sm:inline"
                style={{ fontFamily: MONO }}
              >
                &#8629; trace
              </span>
            </div>

            {/* returned answer - traces back UP the chain, 3 hops */}
            <div
              className="mt-3 border-l-2 pl-4"
              style={{ borderColor: `${ACCENT}66` }}
            >
              {[
                { hop: "hop 1 → 14:23:07", text: "edit on auth/sso.ts by refactor-bot" },
                { hop: "hop 2 → 14:23:02", text: "chose a NEW file (session.ts had 6 callers)" },
                { hop: "hop 3 → 14:22:58", text: "plan scoped the work to src/auth/* — at user request" },
              ].map((h, i) => (
                <div
                  key={h.hop}
                  className="q-hop flex flex-wrap items-baseline gap-x-2 py-1 text-[12.5px]"
                  style={
                    {
                      fontFamily: MONO,
                      "--hd": `${1.7 + i * 0.15}s`,
                    } as CSSProperties
                  }
                >
                  <span style={{ color: ACCENT }}>{h.hop}</span>
                  <span className="text-[#9aa3b8]">{h.text}</span>
                </div>
              ))}
              <p
                className="q-root mt-2 text-[12px] italic text-[#8a92a6]"
                style={
                  {
                    fontFamily: "Georgia, serif",
                    "--hd": "2.25s",
                  } as CSSProperties
                }
              >
                Root cause: the user asked. The path proves it &mdash; no guessing, no archaeology.
              </p>
            </div>
          </section>

          {/* ---- CLOSING line at the base of the spine ---- */}
          <section
            data-reveal
            className="relative pt-10 pb-10 pl-12 sm:pb-20 sm:pl-[calc(33%+2.5rem)]"
          >
            {/* terminal node - closes the spine */}
            <div className="absolute left-[18px] top-[18px] -translate-x-1/2 sm:left-[33%]">
              <Node active />
            </div>
            <p
              className="text-[22px] font-medium text-white sm:text-[26px]"
              style={{ fontFamily: "Georgia, serif" }}
            >
              The path is the proof.
            </p>
            <Link
              href="/signup"
              className="cta-outline mt-5 inline-flex items-center gap-2 px-5 py-3.5 text-[13px] sm:py-2.5"
              style={{ fontFamily: MONO, borderRadius: 8 }}
            >
              $ cairn record &rarr;
            </Link>
          </section>
        </div>
      </div>

      {/* ============================================================
          FOOTER - minimal
      ============================================================ */}
      <footer className="border-t border-[#16191f]">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div
            className="flex items-center gap-2 text-[11px] text-[#7c8498]"
            style={{ fontFamily: MONO }}
          >
            <StackGlyph size={14} />
            <span className="text-[#9aa3b8]">{appConfig.name}</span>
            <span>&middot;</span>
            <span>London</span>
          </div>
          <a
            href="https://abduljaleel.xyz/aletheia/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-[#8a92a6] transition-colors hover:text-white"
            style={{ fontFamily: MONO }}
          >
            Part of the Aletheia stack ↗
          </a>
        </div>
      </footer>
    </main>
  );
}
