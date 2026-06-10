"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getBenchmarkSummary, type BenchmarkSummary } from "@/lib/data/api";
import { dimensionColors } from "@/lib/data/questions";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, ArrowRight } from "lucide-react";

export default function BenchmarksPage() {
  const [summary, setSummary] = useState<BenchmarkSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setSummary(await getBenchmarkSummary());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load benchmarks");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Industry Benchmarks</h1>
          <p className="text-muted-foreground">
            Compare your AI maturity against industry averages
          </p>
        </div>
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Industry Benchmarks</h1>
          <p className="text-muted-foreground">
            Compare your AI maturity against industry averages
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
              <p className="font-medium">No benchmark data yet</p>
              <p className="text-sm text-muted-foreground">
                Complete an assessment and visit your scorecard to generate
                benchmark comparisons.
              </p>
              <div className="flex gap-3">
                <Link href="/assessments/new">
                  <Button>
                    Start New Assessment
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/scorecard">
                  <Button variant="outline">View Scorecard</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  const { rows: benchmarkData, overallScore, overallBenchmark, overallDiff, overallPercentile } = summary;

  // Max bar width calculation
  const maxScore = 5;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Industry Benchmarks</h1>
        <p className="text-muted-foreground">
          Compare your AI maturity against industry averages
        </p>
      </div>

      {/* Overall Comparison */}
      <Card>
        <CardContent className="py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Your Overall Score</p>
              <p className="text-4xl font-bold">{overallScore.toFixed(1)}</p>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Industry Average</p>
              <p className="text-4xl font-bold text-muted-foreground">
                {overallBenchmark.toFixed(1)}
              </p>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Your Percentile</p>
              <p className="text-4xl font-bold">
                {overallPercentile}
                <span className="text-lg text-muted-foreground">th</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              {overallDiff > 0 ? (
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200" variant="outline">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  +{overallDiff} above avg
                </Badge>
              ) : overallDiff < 0 ? (
                <Badge className="bg-red-50 text-red-700 border-red-200" variant="outline">
                  <TrendingDown className="mr-1 h-3 w-3" />
                  {overallDiff} below avg
                </Badge>
              ) : (
                <Badge variant="outline">
                  <Minus className="mr-1 h-3 w-3" />
                  At average
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bar Chart Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Dimension Comparison</CardTitle>
          <CardDescription>
            Your score vs. industry average across all 6 dimensions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {benchmarkData.map((item) => (
              <div key={item.dimension} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: dimensionColors[item.dimension] }}
                    />
                    <span className="font-medium">{item.dimension}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="tabular-nums font-semibold">
                      {item.score.toFixed(1)}
                    </span>
                    <span className="text-muted-foreground tabular-nums">
                      vs {item.benchmark.toFixed(1)}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-xs tabular-nums ${
                        item.diff > 0
                          ? "text-emerald-600 border-emerald-200"
                          : item.diff < 0
                            ? "text-red-600 border-red-200"
                            : ""
                      }`}
                    >
                      P{item.percentile}
                    </Badge>
                  </div>
                </div>

                {/* Bars */}
                <div className="space-y-1">
                  {/* Your Score */}
                  <div className="flex items-center gap-2">
                    <span className="w-10 text-xs text-muted-foreground text-right">You</span>
                    <div className="flex-1 h-5 bg-muted rounded overflow-hidden">
                      <div
                        className="h-full rounded transition-all flex items-center justify-end pr-2"
                        style={{
                          width: `${(item.score / maxScore) * 100}%`,
                          backgroundColor: dimensionColors[item.dimension],
                        }}
                      >
                        <span className="text-[10px] font-bold text-white">
                          {item.score.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Industry Average */}
                  <div className="flex items-center gap-2">
                    <span className="w-10 text-xs text-muted-foreground text-right">Avg</span>
                    <div className="flex-1 h-5 bg-muted rounded overflow-hidden">
                      <div
                        className="h-full rounded bg-muted-foreground/30 transition-all flex items-center justify-end pr-2"
                        style={{
                          width: `${(item.benchmark / maxScore) * 100}%`,
                        }}
                      >
                        <span className="text-[10px] font-bold text-muted-foreground">
                          {item.benchmark.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-8 flex items-center gap-6 border-t pt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-3 w-8 rounded bg-primary" />
              <span>Your Organization</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-8 rounded bg-muted-foreground/30" />
              <span>Industry Average</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
