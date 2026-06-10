"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getMaturityLevel,
  getMaturityColor,
  getTrend,
  type Assessment,
} from "@/lib/data/assessments";
import { ensureScorecards, listAssessments } from "@/lib/data/api";
import { dimensionDescriptions, dimensionColors } from "@/lib/data/questions";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, ArrowRight } from "lucide-react";

export default function ScorecardPage() {
  const [latest, setLatest] = useState<Assessment | null>(null);
  const [previous, setPrevious] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const assessments = await listAssessments();
        const completed = assessments.filter((a) => a.status === "completed");
        const latestCompleted = completed[0] ?? null;
        const previousCompleted = completed[1] ?? null;
        setLatest(latestCompleted);
        setPrevious(previousCompleted);
        if (latestCompleted) {
          // Persist (or read back) the scorecards backing this assessment so
          // benchmarks can aggregate them.
          await ensureScorecards(latestCompleted, previousCompleted);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load scorecard");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Scorecard</h1>
          <p className="text-muted-foreground">
            Your AI competitiveness across all dimensions
          </p>
        </div>
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !latest) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Scorecard</h1>
          <p className="text-muted-foreground">
            Your AI competitiveness across all dimensions
          </p>
        </div>
        {error ? (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <p className="font-medium">No completed assessments yet</p>
              <p className="text-sm text-muted-foreground">
                Complete an AI competitiveness diagnostic to build your scorecard.
              </p>
              <Link href="/assessments/new">
                <Button>
                  Start New Assessment
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Scorecard</h1>
        <p className="text-muted-foreground">
          Your AI competitiveness across all dimensions — {latest.name}
        </p>
      </div>

      {/* Overall Score */}
      <Card>
        <CardContent className="flex items-center gap-6 py-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-primary">
            <span className="text-3xl font-bold">{latest.overallScore.toFixed(1)}</span>
          </div>
          <div>
            <p className="text-lg font-semibold">Overall AI Competitiveness</p>
            <p className="text-muted-foreground">
              Maturity Level:{" "}
              <span className="font-medium text-foreground">
                {getMaturityLevel(latest.overallScore)}
              </span>
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Based on {latest.name} completed on{" "}
              {new Date(latest.date).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Dimension Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {latest.dimensionScores.map((ds) => {
          const trend = getTrend(latest, previous ?? undefined, ds.dimension);
          const maturity = getMaturityLevel(ds.average);
          const colorClasses = getMaturityColor(ds.average);

          return (
            <Card key={ds.dimension}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: dimensionColors[ds.dimension] }}
                    />
                    <CardTitle>{ds.dimension}</CardTitle>
                  </div>
                  <Badge
                    variant="outline"
                    className={colorClasses}
                  >
                    {maturity}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  {dimensionDescriptions[ds.dimension]}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-bold">{ds.average.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">out of 5.0</p>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    {trend > 0 ? (
                      <>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                        <span className="text-emerald-600 font-medium">+{trend}</span>
                      </>
                    ) : trend < 0 ? (
                      <>
                        <TrendingDown className="h-4 w-4 text-red-500" />
                        <span className="text-red-600 font-medium">{trend}</span>
                      </>
                    ) : (
                      <>
                        <Minus className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">0.0</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Score Bar */}
                <div className="mt-4">
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(ds.average / 5) * 100}%`,
                        backgroundColor: dimensionColors[ds.dimension],
                      }}
                    />
                  </div>
                </div>

                {/* Score Breakdown */}
                <div className="mt-3 flex justify-between text-xs text-muted-foreground">
                  <span>{ds.score} / {ds.maxScore} points</span>
                  <span>
                    {trend > 0 ? "Improving" : trend < 0 ? "Declining" : "Stable"} vs prior
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
