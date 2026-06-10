"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getMaturityLevel,
  getMaturityColor,
  type Assessment,
} from "@/lib/data/assessments";
import { getAssessmentWithScores } from "@/lib/data/api";
import { dimensionColors } from "@/lib/data/questions";
import { ArrowRight, TrendingUp, AlertTriangle, ArrowLeft } from "lucide-react";

function RadarChart({
  scores,
}: {
  scores: { dimension: string; average: number }[];
}) {
  const size = 300;
  const center = size / 2;
  const radius = 120;
  const levels = 5;

  // Calculate point positions for 6 axes
  const angleStep = (2 * Math.PI) / 6;
  const startAngle = -Math.PI / 2; // Start from top

  const getPoint = (index: number, value: number) => {
    const angle = startAngle + index * angleStep;
    const r = (value / 5) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  // Grid levels
  const gridLevels = Array.from({ length: levels }, (_, i) => i + 1);

  // Data points
  const dataPoints = scores.map((s, i) => getPoint(i, s.average));

  // Axis labels
  const labelOffset = 20;
  const labels = scores.map((s, i) => {
    const angle = startAngle + i * angleStep;
    const r = radius + labelOffset;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
      text: s.dimension,
      score: s.average,
    };
  });

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-md mx-auto">
      {/* Grid */}
      {gridLevels.map((level) => {
        const points = Array.from({ length: 6 }, (_, i) => {
          const p = getPoint(i, level);
          return `${p.x},${p.y}`;
        }).join(" ");
        return (
          <polygon
            key={level}
            points={points}
            fill="none"
            stroke="currentColor"
            strokeWidth={level === 5 ? 1 : 0.5}
            className="text-border"
            opacity={0.4}
          />
        );
      })}

      {/* Axes */}
      {scores.map((_, i) => {
        const p = getPoint(i, 5);
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={p.x}
            y2={p.y}
            stroke="currentColor"
            strokeWidth={0.5}
            className="text-border"
            opacity={0.4}
          />
        );
      })}

      {/* Data polygon */}
      <polygon
        points={dataPoints.map((p) => `${p.x},${p.y}`).join(" ")}
        fill="hsl(var(--primary))"
        fillOpacity={0.15}
        stroke="hsl(var(--primary))"
        strokeWidth={2}
      />

      {/* Data points */}
      {dataPoints.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={4}
          fill="hsl(var(--primary))"
          stroke="hsl(var(--background))"
          strokeWidth={2}
        />
      ))}

      {/* Labels */}
      {labels.map((label, i) => (
        <g key={i}>
          <text
            x={label.x}
            y={label.y - 6}
            textAnchor="middle"
            className="fill-foreground text-[11px] font-medium"
          >
            {label.text}
          </text>
          <text
            x={label.x}
            y={label.y + 8}
            textAnchor="middle"
            className="fill-muted-foreground text-[10px]"
          >
            {label.score.toFixed(1)}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function AssessmentResultsPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const loaded = await getAssessmentWithScores(id);
        if (!loaded) {
          setError("Assessment not found.");
        } else {
          setAssessment(loaded);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load results");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/assessments">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-96 w-full" />
          <div className="space-y-4">
            <Skeleton className="h-44 w-full" />
            <Skeleton className="h-44 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !assessment || assessment.dimensionScores.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/assessments">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Assessment Results</h1>
            <p className="text-muted-foreground">AI competitiveness diagnostic</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            {error ??
              "This assessment has no responses yet — complete the questionnaire to see results."}
          </span>
        </div>
        <div className="flex gap-4">
          {!error && assessment && (
            <Link href={`/assessments/${assessment.id}`}>
              <Button>
                Continue Assessment
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          )}
          <Link href="/assessments">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Assessments
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const sortedDimensions = [...assessment.dimensionScores].sort(
    (a, b) => b.average - a.average
  );
  const strengths = sortedDimensions.slice(0, 2);
  const improvements = sortedDimensions.slice(-2).reverse();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/assessments">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {assessment.name}
          </h1>
          <p className="text-muted-foreground">
            Completed{" "}
            {new Date(assessment.date).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>AI Competitiveness Radar</CardTitle>
            <CardDescription>
              Your performance across all 6 dimensions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadarChart scores={assessment.dimensionScores} />
            <div className="mt-4 text-center">
              <p className="text-3xl font-bold">{assessment.overallScore.toFixed(1)}</p>
              <p className="text-sm text-muted-foreground">
                Overall Score — {getMaturityLevel(assessment.overallScore)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Dimension Breakdown */}
        <div className="space-y-4">
          {/* Strengths */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                Top Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {strengths.map((ds) => (
                  <div
                    key={ds.dimension}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: dimensionColors[ds.dimension] }}
                      />
                      <span className="font-medium">{ds.dimension}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">{ds.average.toFixed(1)}</span>
                      <Badge
                        variant="outline"
                        className={getMaturityColor(ds.average)}
                      >
                        {getMaturityLevel(ds.average)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Improvement Areas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Areas for Improvement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {improvements.map((ds) => (
                  <div
                    key={ds.dimension}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: dimensionColors[ds.dimension] }}
                      />
                      <span className="font-medium">{ds.dimension}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">{ds.average.toFixed(1)}</span>
                      <Badge
                        variant="outline"
                        className={getMaturityColor(ds.average)}
                      >
                        {getMaturityLevel(ds.average)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* All Dimension Scores */}
      <Card>
        <CardHeader>
          <CardTitle>Dimension Scores</CardTitle>
          <CardDescription>Detailed breakdown with color-coded maturity levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {assessment.dimensionScores.map((ds) => (
              <div
                key={ds.dimension}
                className="flex items-center gap-4 rounded-lg border p-4"
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-lg text-white font-bold text-lg"
                  style={{ backgroundColor: dimensionColors[ds.dimension] }}
                >
                  {ds.average.toFixed(1)}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{ds.dimension}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(ds.average / 5) * 100}%`,
                          backgroundColor: dimensionColors[ds.dimension],
                        }}
                      />
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${getMaturityColor(ds.average)}`}
                    >
                      {getMaturityLevel(ds.average)}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="flex gap-4">
        <Link href={`/assessments/${assessment.id}/roadmap`}>
          <Button>
            View Transformation Roadmap
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
        <Link href="/scorecard">
          <Button variant="outline">View Full Scorecard</Button>
        </Link>
        <Link href="/benchmarks">
          <Button variant="outline">Compare Benchmarks</Button>
        </Link>
      </div>
    </div>
  );
}
