"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getMaturityLevel, type Assessment } from "@/lib/data/assessments";
import { getCurrentUserName, listAssessments, seedDemoData } from "@/lib/data/api";
import { ArrowRight, BarChart3, Brain, CheckSquare, Target, TrendingUp, AlertTriangle, Database, Loader2 } from "lucide-react";

export default function DashboardPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [userName, setUserName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [rows, name] = await Promise.all([
        listAssessments(),
        getCurrentUserName(),
      ]);
      setAssessments(rows);
      setUserName(name);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSeedDemo = async () => {
    setSeeding(true);
    setError(null);
    try {
      await seedDemoData();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load demo data");
    } finally {
      setSeeding(false);
    }
  };

  const completed = assessments.filter((a) => a.status === "completed");
  const latest = completed[0] ?? null;
  const topDimension = latest
    ? [...latest.dimensionScores].sort((a, b) => b.average - a.average)[0]
    : null;
  const weakDimensions = latest
    ? latest.dimensionScores.filter((d) => d.average < 3.0)
    : [];

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Loading your workspace…</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-72 w-full lg:col-span-2" />
          <Skeleton className="h-72 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back{userName ? `, ${userName}` : ""}
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
          <Button variant="outline" size="sm" className="ml-auto" onClick={load}>
            Retry
          </Button>
        </div>
      )}

      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Assessments Completed"
          value={String(completed.length)}
          description="Across all quarters"
          icon={<CheckSquare className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Average Score"
          value={latest ? `${latest.overallScore.toFixed(1)} / 5` : "—"}
          description="Latest assessment"
          icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Top Dimension"
          value={topDimension ? topDimension.dimension : "—"}
          description={
            topDimension
              ? `Score: ${topDimension.average.toFixed(1)} — ${getMaturityLevel(topDimension.average)}`
              : "Complete an assessment to see this"
          }
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Areas to Improve"
          value={latest ? String(weakDimensions.length) : "—"}
          description={weakDimensions.map((d) => d.dimension).join(", ") || "None"}
          icon={<AlertTriangle className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Assessments */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Assessments</CardTitle>
              <CardDescription>Your AI competitiveness diagnostic history</CardDescription>
            </CardHeader>
            <CardContent>
              {assessments.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-10 text-center">
                  <Brain className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="font-medium">No assessments yet</p>
                    <p className="text-sm text-muted-foreground">
                      Start your first diagnostic, or load demo data to explore the product.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleSeedDemo}
                    disabled={seeding}
                  >
                    {seeding ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Database className="mr-2 h-4 w-4" />
                    )}
                    {seeding ? "Loading demo data…" : "Load demo data"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {assessments.slice(0, 3).map((assessment) => (
                    <Link
                      key={assessment.id}
                      href={
                        assessment.status === "completed"
                          ? `/assessments/${assessment.id}/results`
                          : `/assessments/${assessment.id}`
                      }
                      className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{assessment.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(assessment.date).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {assessment.status === "completed" ? (
                          <>
                            <div className="text-right">
                              <p className="text-lg font-semibold">{assessment.overallScore.toFixed(1)}</p>
                              <p className="text-xs text-muted-foreground">/ 5.0</p>
                            </div>
                            <Badge variant="secondary">
                              {getMaturityLevel(assessment.overallScore)}
                            </Badge>
                          </>
                        ) : (
                          <Badge variant="outline">
                            {assessment.status === "in-progress" ? "In Progress" : "Draft"}
                          </Badge>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Link href="/assessments" className="w-full">
                <Button variant="outline" className="w-full">
                  View All Assessments
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>

        {/* CTA Card */}
        <div>
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Brain className="h-5 w-5" />
              </div>
              <CardTitle className="mt-2">Begin Assessment</CardTitle>
              <CardDescription>
                Take the AI Competitiveness Diagnostic to understand where your enterprise stands and where to invest next.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  6 dimensions, 30 questions
                </li>
                <li className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Instant scorecard and radar chart
                </li>
                <li className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Prioritized transformation roadmap
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Link href="/assessments/new" className="w-full">
                <Button className="w-full">
                  Start New Assessment
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
