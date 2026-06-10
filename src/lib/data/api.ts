import { createClient } from "@/lib/supabase/client";
import {
  dimensions,
  questions as questionCatalog,
  type Dimension,
  type Question,
} from "./questions";
import {
  industryBenchmarks,
  mockAssessments,
  mockRecommendations,
  type Assessment,
  type DimensionScore,
  type Recommendation,
} from "./assessments";

type SupabaseClient = ReturnType<typeof createClient>;

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export async function getCtx() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();
  if (!profile?.org_id) throw new Error("No organization found for this user");
  return { supabase, userId: user.id, orgId: profile.org_id as string };
}

export async function getCurrentUserName(): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "";
  return (user.user_metadata?.full_name as string) || user.email || "";
}

// ---------------------------------------------------------------------------
// Row types (DB snake_case) and mappers to the existing UI types
// ---------------------------------------------------------------------------

interface QuestionRow {
  id: string;
  dimension: string;
  question_text: string;
  question_type: string;
  weight: number | null;
  order_index: number;
  is_active: boolean | null;
}

interface AssessmentRow {
  id: string;
  org_id: string | null;
  user_id: string | null;
  status: string | null;
  started_at: string | null;
  completed_at: string | null;
  overall_score: number | string | null;
  dimension_scores: unknown;
  created_at: string | null;
}

interface ScorecardRow {
  id: string;
  org_id: string | null;
  assessment_id: string | null;
  dimension: string;
  score: number | string;
  benchmark_percentile: number | string | null;
  trend_direction: string | null;
  period: string;
  created_at: string | null;
}

export interface ScorecardEntry {
  id: string;
  assessmentId: string;
  dimension: Dimension;
  score: number;
  benchmarkPercentile: number;
  trendDirection: "up" | "down" | "stable";
  period: string;
  createdAt: string;
}

export interface RoadmapData {
  recommendations: Recommendation[];
  priorityActions: string[];
}

const descriptionByText = new Map(
  questionCatalog.map((q) => [q.text, q.description])
);

function mapQuestion(row: QuestionRow): Question {
  return {
    id: row.id,
    dimension: row.dimension as Dimension,
    text: row.question_text,
    description: descriptionByText.get(row.question_text) ?? "",
  };
}

function deriveAssessmentName(dateIso: string): string {
  const d = new Date(dateIso);
  const quarter = Math.floor(d.getMonth() / 3) + 1;
  // Include the day so multiple assessments in the same quarter stay
  // distinguishable in lists and headers (e.g. "Q2 2026 Assessment — 4 Jun").
  const day = d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return `Q${quarter} ${d.getFullYear()} Assessment — ${day}`;
}

function periodLabel(dateIso: string): string {
  const d = new Date(dateIso);
  return `Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}`;
}

function mapAssessment(row: AssessmentRow): Assessment {
  const date =
    row.completed_at ?? row.started_at ?? row.created_at ?? new Date().toISOString();
  const raw = row.dimension_scores;
  const dimensionScores: DimensionScore[] = Array.isArray(raw)
    ? (raw as DimensionScore[]).map((ds) => ({
        dimension: ds.dimension,
        score: Number(ds.score),
        maxScore: Number(ds.maxScore),
        average: Number(ds.average),
      }))
    : [];
  const status: Assessment["status"] =
    row.status === "completed"
      ? "completed"
      : row.status === "in-progress" || row.status === "in_progress"
        ? "in-progress"
        : "draft";
  return {
    id: row.id,
    name: deriveAssessmentName(date),
    date,
    status,
    overallScore: row.overall_score == null ? 0 : Number(row.overall_score),
    dimensionScores,
    responses: {},
  };
}

function mapScorecard(row: ScorecardRow): ScorecardEntry {
  return {
    id: row.id,
    assessmentId: row.assessment_id ?? "",
    dimension: row.dimension as Dimension,
    score: Number(row.score),
    benchmarkPercentile:
      row.benchmark_percentile == null ? 50 : Number(row.benchmark_percentile),
    trendDirection:
      row.trend_direction === "up" || row.trend_direction === "down"
        ? row.trend_direction
        : "stable",
    period: row.period,
    createdAt: row.created_at ?? "",
  };
}

// ---------------------------------------------------------------------------
// Questions (global catalog — seeds itself on first use if empty)
// ---------------------------------------------------------------------------

async function seedQuestionCatalog(supabase: SupabaseClient): Promise<void> {
  const rows = questionCatalog.map((q, index) => ({
    dimension: q.dimension,
    // "likert" is the canonical DB value (the catalog is 1-5 Likert items
    // and the migration CHECK only allows likert/multiple_choice/open_text/numeric).
    question_type: "likert",
    question_text: q.text,
    weight: 1,
    order_index: index,
    is_active: true,
  }));
  const { error } = await supabase.from("questions").insert(rows);
  // 23505 = unique violation: another session seeded the catalog concurrently
  // (idempotent once a unique index on question_text exists). Treat as success.
  if (error && error.code !== "23505") throw new Error(error.message);
}

/**
 * The global catalog has no DB-level uniqueness guard yet, so a concurrent
 * first-load race can write duplicate rows. Deduplicate by question_text on
 * read (keeping the first occurrence in order_index order) so duplicates can
 * never double the questionnaire or computeScores' maxScore.
 */
function dedupeQuestionRows(rows: QuestionRow[]): QuestionRow[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    if (seen.has(row.question_text)) return false;
    seen.add(row.question_text);
    return true;
  });
}

async function fetchQuestionRows(supabase: SupabaseClient): Promise<QuestionRow[]> {
  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .eq("is_active", true)
    .order("order_index", { ascending: true });
  if (error) throw new Error(error.message);
  if (data && data.length > 0) return dedupeQuestionRows(data as QuestionRow[]);
  await seedQuestionCatalog(supabase);
  const retry = await supabase
    .from("questions")
    .select("*")
    .eq("is_active", true)
    .order("order_index", { ascending: true });
  if (retry.error) throw new Error(retry.error.message);
  return dedupeQuestionRows((retry.data ?? []) as QuestionRow[]);
}

export async function listQuestions(): Promise<Question[]> {
  const { supabase } = await getCtx();
  const rows = await fetchQuestionRows(supabase);
  return rows.map(mapQuestion);
}

// ---------------------------------------------------------------------------
// Assessments
// ---------------------------------------------------------------------------

export async function listAssessments(): Promise<Assessment[]> {
  const { supabase, orgId } = await getCtx();
  const { data, error } = await supabase
    .from("assessments")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const assessments = ((data ?? []) as AssessmentRow[]).map(mapAssessment);
  return assessments.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export async function getAssessment(id: string): Promise<Assessment | null> {
  const { supabase } = await getCtx();
  const { data, error } = await supabase
    .from("assessments")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapAssessment(data as AssessmentRow) : null;
}

export async function createAssessment(): Promise<Assessment> {
  const { supabase, orgId, userId } = await getCtx();
  const { data, error } = await supabase
    .from("assessments")
    .insert({
      org_id: orgId,
      user_id: userId,
      // Canonical DB value (matches the migration CHECK constraint);
      // mapAssessment normalizes it to the UI's "in-progress" on read.
      status: "in_progress",
      started_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapAssessment(data as AssessmentRow);
}

export function computeScores(
  questions: Question[],
  responses: Record<string, number>
): { overall: number; dimensionScores: DimensionScore[] } {
  const dimensionScores: DimensionScore[] = dimensions.map((dimension) => {
    const dimQuestions = questions.filter((q) => q.dimension === dimension);
    const score = dimQuestions.reduce(
      (sum, q) => sum + (responses[q.id] ?? 0),
      0
    );
    const maxScore = dimQuestions.length * 5;
    const average = dimQuestions.length
      ? Number((score / dimQuestions.length).toFixed(1))
      : 0;
    return { dimension, score, maxScore, average };
  });
  const values = Object.values(responses);
  const overall = values.length
    ? Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1))
    : 0;
  return { overall, dimensionScores };
}

export async function completeAssessment(
  assessmentId: string,
  questions: Question[],
  responses: Record<string, number>
): Promise<Assessment> {
  const { supabase } = await getCtx();
  const { overall, dimensionScores } = computeScores(questions, responses);
  const { data, error } = await supabase
    .from("assessments")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      overall_score: overall,
      dimension_scores: dimensionScores,
    })
    .eq("id", assessmentId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapAssessment(data as AssessmentRow);
}

// ---------------------------------------------------------------------------
// Assessment responses
// ---------------------------------------------------------------------------

export async function getResponses(
  assessmentId: string
): Promise<Record<string, number>> {
  const { supabase } = await getCtx();
  const { data, error } = await supabase
    .from("assessment_responses")
    .select("question_id, score")
    .eq("assessment_id", assessmentId);
  if (error) throw new Error(error.message);
  const map: Record<string, number> = {};
  for (const row of (data ?? []) as { question_id: string | null; score: number | string | null }[]) {
    if (row.question_id != null && row.score != null) {
      map[row.question_id] = Number(row.score);
    }
  }
  return map;
}

export async function saveResponse(
  assessmentId: string,
  question: Question,
  value: number
): Promise<void> {
  const { supabase } = await getCtx();
  const { data: existing, error: selectError } = await supabase
    .from("assessment_responses")
    .select("id")
    .eq("assessment_id", assessmentId)
    .eq("question_id", question.id)
    .maybeSingle();
  if (selectError) throw new Error(selectError.message);
  if (existing) {
    const { error } = await supabase
      .from("assessment_responses")
      .update({ response_value: String(value), score: value })
      .eq("id", (existing as { id: string }).id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("assessment_responses").insert({
      assessment_id: assessmentId,
      question_id: question.id,
      dimension: question.dimension,
      response_value: String(value),
      score: value,
    });
    if (error) throw new Error(error.message);
  }
}

/**
 * Single assessment with its responses loaded. If the stored
 * dimension_scores are missing (e.g. legacy/in-progress rows), they are
 * computed from the persisted responses.
 */
export async function getAssessmentWithScores(
  id: string
): Promise<Assessment | null> {
  const assessment = await getAssessment(id);
  if (!assessment) return null;
  const responses = await getResponses(id);
  assessment.responses = responses;
  if (
    assessment.dimensionScores.length === 0 &&
    Object.keys(responses).length > 0
  ) {
    const questions = await listQuestions();
    const { overall, dimensionScores } = computeScores(questions, responses);
    assessment.dimensionScores = dimensionScores;
    if (!assessment.overallScore) assessment.overallScore = overall;
  }
  return assessment;
}

// ---------------------------------------------------------------------------
// Roadmaps
// ---------------------------------------------------------------------------

const impactRank: Record<Recommendation["impact"], number> = {
  High: 0,
  Medium: 1,
  Low: 2,
};
const effortRank: Record<Recommendation["effort"], number> = {
  Low: 0,
  Medium: 1,
  High: 2,
};

function buildRoadmapRecommendations(
  dimensionScores: DimensionScore[]
): Recommendation[] {
  const avgByDimension = new Map<Dimension, number>(
    dimensionScores.map((ds) => [ds.dimension, ds.average])
  );
  const prioritized = [...mockRecommendations].sort((a, b) => {
    const avgA = avgByDimension.get(a.dimension) ?? 3;
    const avgB = avgByDimension.get(b.dimension) ?? 3;
    return (
      avgA - avgB ||
      impactRank[a.impact] - impactRank[b.impact] ||
      effortRank[a.effort] - effortRank[b.effort]
    );
  });
  // Focus on dimensions that are not yet "Advanced" (< 4.0), but always
  // return at least six actions so the roadmap stays substantive.
  const focused = prioritized.filter(
    (r) => (avgByDimension.get(r.dimension) ?? 0) < 4.0
  );
  return focused.length >= 6 ? focused : prioritized.slice(0, 6);
}

function buildPriorityActions(recommendations: Recommendation[]): string[] {
  return recommendations
    .filter((r) => r.impact === "High")
    .slice(0, 3)
    .map((r) => r.title);
}

export async function getOrCreateRoadmap(
  assessment: Assessment
): Promise<RoadmapData> {
  const { supabase } = await getCtx();
  const { data: existing, error: selectError } = await supabase
    .from("roadmaps")
    .select("recommendations, priority_actions")
    .eq("assessment_id", assessment.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (selectError) throw new Error(selectError.message);
  if (existing) {
    const row = existing as {
      recommendations: unknown;
      priority_actions: unknown;
    };
    return {
      recommendations: Array.isArray(row.recommendations)
        ? (row.recommendations as Recommendation[])
        : [],
      priorityActions: Array.isArray(row.priority_actions)
        ? (row.priority_actions as string[])
        : [],
    };
  }
  const recommendations = buildRoadmapRecommendations(
    assessment.dimensionScores
  );
  const priorityActions = buildPriorityActions(recommendations);
  const { error } = await supabase.from("roadmaps").insert({
    assessment_id: assessment.id,
    generated_at: new Date().toISOString(),
    recommendations,
    priority_actions: priorityActions,
  });
  if (error) throw new Error(error.message);
  return { recommendations, priorityActions };
}

// ---------------------------------------------------------------------------
// Scorecards
// ---------------------------------------------------------------------------

function percentileFor(score: number, benchmark: number): number {
  return Math.min(99, Math.max(1, Math.round(50 + (score - benchmark) * 20)));
}

export async function ensureScorecards(
  latest: Assessment,
  previous?: Assessment | null
): Promise<ScorecardEntry[]> {
  const { supabase, orgId } = await getCtx();
  const { data: existing, error: selectError } = await supabase
    .from("scorecards")
    .select("*")
    .eq("assessment_id", latest.id);
  if (selectError) throw new Error(selectError.message);
  if (existing && existing.length > 0) {
    return (existing as ScorecardRow[]).map(mapScorecard);
  }
  const rows = latest.dimensionScores.map((ds) => {
    const prev = previous?.dimensionScores.find(
      (p) => p.dimension === ds.dimension
    );
    const delta = prev ? ds.average - prev.average : 0;
    return {
      org_id: orgId,
      assessment_id: latest.id,
      dimension: ds.dimension,
      score: ds.average,
      benchmark_percentile: percentileFor(
        ds.average,
        industryBenchmarks[ds.dimension]
      ),
      // "flat" is the canonical DB value (matches the migration CHECK);
      // mapScorecard normalizes anything not "up"/"down" to "stable" for the UI.
      trend_direction: delta > 0.05 ? "up" : delta < -0.05 ? "down" : "flat",
      period: periodLabel(latest.date),
    };
  });
  if (rows.length === 0) return [];
  const { data, error } = await supabase
    .from("scorecards")
    .insert(rows)
    .select("*");
  if (error) throw new Error(error.message);
  return ((data ?? []) as ScorecardRow[]).map(mapScorecard);
}

export async function listScorecards(): Promise<ScorecardEntry[]> {
  const { supabase, orgId } = await getCtx();
  const { data, error } = await supabase
    .from("scorecards")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as ScorecardRow[]).map(mapScorecard);
}

// ---------------------------------------------------------------------------
// Benchmarks (aggregated from scorecards — no separate benchmarks table)
// ---------------------------------------------------------------------------

export interface BenchmarkRow {
  dimension: Dimension;
  score: number;
  benchmark: number;
  diff: number;
  percentile: number;
}

export interface BenchmarkSummary {
  rows: BenchmarkRow[];
  overallScore: number;
  overallBenchmark: number;
  overallDiff: number;
  overallPercentile: number;
}

export async function getBenchmarkSummary(): Promise<BenchmarkSummary | null> {
  const entries = await listScorecards();
  if (entries.length === 0) return null;
  // Entries are ordered newest-first; keep the most recent per dimension.
  const latestByDimension = new Map<Dimension, ScorecardEntry>();
  for (const entry of entries) {
    if (!latestByDimension.has(entry.dimension)) {
      latestByDimension.set(entry.dimension, entry);
    }
  }
  const rows: BenchmarkRow[] = dimensions
    .filter((dim) => latestByDimension.has(dim))
    .map((dim) => {
      const entry = latestByDimension.get(dim)!;
      const benchmark = industryBenchmarks[dim];
      return {
        dimension: dim,
        score: entry.score,
        benchmark,
        diff: Number((entry.score - benchmark).toFixed(1)),
        percentile: Math.round(entry.benchmarkPercentile),
      };
    });
  if (rows.length === 0) return null;
  const overallScore = Number(
    (rows.reduce((sum, r) => sum + r.score, 0) / rows.length).toFixed(1)
  );
  const overallBenchmark = Number(
    (
      Object.values(industryBenchmarks).reduce((a, b) => a + b, 0) /
      dimensions.length
    ).toFixed(1)
  );
  return {
    rows,
    overallScore,
    overallBenchmark,
    overallDiff: Number((overallScore - overallBenchmark).toFixed(1)),
    overallPercentile: percentileFor(overallScore, overallBenchmark),
  };
}

// ---------------------------------------------------------------------------
// Demo data seeding
// ---------------------------------------------------------------------------

const DAY_MS = 24 * 60 * 60 * 1000;

export async function seedDemoData(): Promise<void> {
  const { supabase, orgId, userId } = await getCtx();

  // 1. Make sure the global question catalog exists, and map seed ids
  //    (s1..c5) to the catalog's database uuids via question text.
  const questionRows = await fetchQuestionRows(supabase);
  const idByText = new Map(questionRows.map((r) => [r.question_text, r.id]));
  const seedIdToDbId = new Map<string, string>();
  const dimensionBySeedId = new Map<string, Dimension>();
  for (const q of questionCatalog) {
    const dbId = idByText.get(q.text);
    if (dbId) seedIdToDbId.set(q.id, dbId);
    dimensionBySeedId.set(q.id, q.dimension);
  }

  // 2. Two completed demo assessments (older first), dated relative to today.
  const demos = [
    { source: mockAssessments[1], daysAgo: 97 },
    { source: mockAssessments[0], daysAgo: 7 },
  ];
  const inserted: Assessment[] = [];
  for (const demo of demos) {
    const completedAt = new Date(Date.now() - demo.daysAgo * DAY_MS);
    const startedAt = new Date(completedAt.getTime() - 45 * 60 * 1000);
    const { data, error } = await supabase
      .from("assessments")
      .insert({
        org_id: orgId,
        user_id: userId,
        status: "completed",
        started_at: startedAt.toISOString(),
        completed_at: completedAt.toISOString(),
        overall_score: demo.source.overallScore,
        dimension_scores: demo.source.dimensionScores,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    const assessment = mapAssessment(data as AssessmentRow);

    // 3. The 30 responses behind each assessment.
    const responseRows = Object.entries(demo.source.responses).flatMap(
      ([seedId, value]) => {
        const questionId = seedIdToDbId.get(seedId);
        const dimension = dimensionBySeedId.get(seedId);
        if (!questionId || !dimension) return [];
        return [
          {
            assessment_id: assessment.id,
            question_id: questionId,
            dimension,
            response_value: String(value),
            score: value,
          },
        ];
      }
    );
    if (responseRows.length > 0) {
      const { error: responseError } = await supabase
        .from("assessment_responses")
        .insert(responseRows);
      if (responseError) throw new Error(responseError.message);
    }
    inserted.push(assessment);
  }

  // 4. Scorecards for both assessments (latest carries trend vs the older
  //    one) and a persisted roadmap for the latest assessment.
  const [older, latest] = inserted;
  await ensureScorecards(older, null);
  await ensureScorecards(latest, older);
  await getOrCreateRoadmap(latest);
}
