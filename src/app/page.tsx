import Link from "next/link";
import { appConfig } from "@/lib/config";

const ACCENT = "#5e7cff";
const MONO =
  "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace";

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
      className="block rounded-full"
      style={{
        width: active ? 13 : 9,
        height: active ? 13 : 9,
        background: active ? ACCENT : "#0b0d10",
        border: `2px solid ${active ? ACCENT : "#2b2f3a"}`,
        boxShadow: active ? `0 0 18px ${ACCENT}, 0 0 4px ${ACCENT}` : "none",
      }}
    />
  );
}

function StoneCard({ s, side }: { s: Stone; side: "left" | "right" }) {
  return (
    <article
      className="border bg-[#0d1015]/90 px-4 py-3.5 backdrop-blur-sm"
      style={{
        borderColor: s.active ? ACCENT : "#1a1e26",
        boxShadow: s.active ? `0 0 34px ${ACCENT}33` : "none",
        borderRadius:
          side === "left" ? "13px 5px 13px 13px" : "5px 13px 13px 13px",
        textAlign: side === "left" ? "right" : "left",
      }}
    >
      <div
        className="flex items-baseline gap-2"
        style={{ flexDirection: side === "left" ? "row-reverse" : "row" }}
      >
        <span
          className="text-[10px] uppercase tracking-[0.18em]"
          style={{ color: s.active ? ACCENT : "#586072", fontFamily: MONO }}
        >
          {s.ts}
        </span>
        <span
          className="text-[10px] uppercase tracking-[0.18em]"
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
        className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[10.5px] text-[#697084]"
        style={{
          fontFamily: MONO,
          justifyContent: side === "left" ? "flex-end" : "flex-start",
        }}
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
      className="min-h-screen bg-[#0b0d10] text-[#c5ccda] antialiased"
      style={{
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
      }}
    >
      {/* ============================================================
          TOP BAR - brand lockup left, auth right
      ============================================================ */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 pt-7 pb-2 sm:px-8">
        <div className="flex items-center gap-2.5">
          <StackGlyph size={22} />
          <span
            className="text-[15px] font-semibold tracking-[0.06em] text-white"
            style={{ fontFamily: MONO }}
          >
            CAIRN
          </span>
          <span
            className="hidden text-[10px] uppercase tracking-[0.28em] text-[#586072] sm:inline"
            style={{ fontFamily: MONO }}
          >
            London 🇬🇧
          </span>
        </div>
        <div
          className="flex items-center gap-4 text-[12px]"
          style={{ fontFamily: MONO }}
        >
          <Link
            href="/login"
            className="text-[#828a9c] transition-colors hover:text-white"
          >
            sign in
          </Link>
          <Link
            href="/signup"
            className="border px-3.5 py-1.5 transition-colors"
            style={{ borderColor: `${ACCENT}55`, color: ACCENT }}
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
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <div className="relative">
          {/* the literal spine line */}
          <div
            aria-hidden="true"
            className="absolute top-0 bottom-0 left-[18px] w-px sm:left-[33%]"
            style={{
              background:
                "linear-gradient(180deg, transparent 0, #2a2f3b 64px, #2a2f3b calc(100% - 120px), transparent 100%)",
            }}
          />
          {/* faint glow rail behind the line */}
          <div
            aria-hidden="true"
            className="absolute left-[17px] top-[64px] h-[40%] w-[3px] sm:left-[calc(33%-1px)]"
            style={{
              background: `linear-gradient(180deg, transparent, ${ACCENT}22, transparent)`,
              filter: "blur(3px)",
            }}
          />

          {/* ---- INTRO at the head of the spine (left-aligned) ---- */}
          <section className="relative pt-12 pb-10 pl-12 sm:pl-[calc(33%+2.5rem)]">
            <p
              className="text-[11px] uppercase tracking-[0.3em]"
              style={{ color: ACCENT, fontFamily: MONO }}
            >
              ./provenance &mdash; session 41a7 &mdash; sealed
            </p>
            <h1 className="mt-4 max-w-xl text-[26px] font-medium leading-[1.32] text-white sm:text-[31px]">
              Every change an agent makes, recorded as a stone on the path. Query
              the chain six months later and the answer is still there.
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[#8b93a7]">
              Causal provenance graph for every agent decision.
            </p>
            <p
              className="mt-4 max-w-md border-l pl-3 text-[13px] italic text-[#697084]"
              style={{ borderColor: `${ACCENT}66`, fontFamily: "Georgia, serif" }}
            >
              &ldquo;Why did the AI change that file? Nobody knows.&rdquo; &mdash; until now.
            </p>
          </section>

          {/* ---- THE CHAIN OF STONES (alternating left / right) ---- */}
          <section className="relative">
            {stones.map((s, idx) => {
              const side: "left" | "right" = idx % 2 === 0 ? "right" : "left";
              return (
                <div key={s.ts} className="relative py-3.5">
                  {/* node on the spine */}
                  <div
                    className="absolute left-[18px] top-[26px] -translate-x-1/2 sm:left-[33%]"
                    style={{ zIndex: 2 }}
                  >
                    <Node active={s.active} />
                  </div>

                  {/* MOBILE: everything to the right of the spine */}
                  <div className="pl-12 sm:hidden">
                    <div
                      aria-hidden="true"
                      className="absolute left-[18px] top-[30px] h-px w-7"
                      style={{ background: s.active ? ACCENT : "#2a2f3b" }}
                    />
                    <StoneCard s={s} side="right" />
                  </div>

                  {/* DESKTOP: alternate sides of the spine */}
                  <div className="hidden sm:block">
                    {side === "right" ? (
                      <div className="ml-[33%] pl-10">
                        <div
                          aria-hidden="true"
                          className="absolute left-[33%] top-[30px] h-px w-9"
                          style={{ background: s.active ? ACCENT : "#2a2f3b" }}
                        />
                        <div className="max-w-md">
                          <StoneCard s={s} side="right" />
                        </div>
                      </div>
                    ) : (
                      <div className="mr-[67%] flex justify-end pr-10">
                        <div
                          aria-hidden="true"
                          className="absolute right-[67%] top-[30px] h-px w-9"
                          style={{ background: s.active ? ACCENT : "#2a2f3b" }}
                        />
                        <div className="max-w-md">
                          <StoneCard s={s} side="left" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </section>

          {/* ---- QUERY AFFORDANCE near the base of the spine ---- */}
          <section className="relative pt-8 pb-4 pl-12 sm:pl-[calc(33%+2.5rem)]">
            <div className="absolute left-[18px] top-[40px] -translate-x-1/2 sm:left-[33%]">
              <Node />
            </div>
            <div
              aria-hidden="true"
              className="absolute left-[18px] top-[44px] h-px w-7 sm:left-[33%] sm:w-9"
              style={{ background: "#2a2f3b" }}
            />

            <p
              className="mb-3 text-[10px] uppercase tracking-[0.28em] text-[#697084]"
              style={{ fontFamily: MONO }}
            >
              replay the chain
            </p>

            {/* faux search bar */}
            <div
              className="flex items-center gap-3 border bg-[#0d1015] px-4 py-3"
              style={{ borderColor: "#222733", borderRadius: 10 }}
            >
              <span style={{ color: ACCENT, fontFamily: MONO }} className="text-sm">
                ask
              </span>
              <span
                className="flex-1 text-[13px] text-[#aab2c6]"
                style={{ fontFamily: MONO }}
              >
                why did auth.ts change on Monday?
              </span>
              <span
                className="text-[10px] uppercase tracking-[0.2em]"
                style={{ color: "#586072", fontFamily: MONO }}
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
              ].map((h) => (
                <div
                  key={h.hop}
                  className="flex flex-wrap items-baseline gap-x-2 py-1 text-[12.5px]"
                  style={{ fontFamily: MONO }}
                >
                  <span style={{ color: ACCENT }}>{h.hop}</span>
                  <span className="text-[#9aa3b8]">{h.text}</span>
                </div>
              ))}
              <p
                className="mt-2 text-[12px] italic text-[#697084]"
                style={{ fontFamily: "Georgia, serif" }}
              >
                Root cause: the user asked. The path proves it &mdash; no guessing, no archaeology.
              </p>
            </div>
          </section>

          {/* ---- CLOSING line at the base of the spine ---- */}
          <section className="relative pt-10 pb-20 pl-12 sm:pl-[calc(33%+2.5rem)]">
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
              className="mt-5 inline-flex items-center gap-2 border px-5 py-2.5 text-[13px] transition-colors"
              style={{
                borderColor: ACCENT,
                color: ACCENT,
                fontFamily: MONO,
                boxShadow: `0 0 22px ${ACCENT}26`,
              }}
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
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div
            className="flex items-center gap-2 text-[11px] text-[#586072]"
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
            className="text-[11px] text-[#697084] transition-colors hover:text-white"
            style={{ fontFamily: MONO }}
          >
            Part of the Aletheia stack ↗
          </a>
        </div>
      </footer>
    </main>
  );
}
