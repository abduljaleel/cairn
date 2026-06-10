"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getMaturityLevel, type Assessment } from "@/lib/data/assessments";
import { listAssessments } from "@/lib/data/api";
import { Plus, ArrowRight, AlertTriangle } from "lucide-react";

export default function AssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setAssessments(await listAssessments());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load assessments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assessments</h1>
          <p className="text-muted-foreground">
            Track your AI competitiveness over time
          </p>
        </div>
        <Link href="/assessments/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Start New Assessment
          </Button>
        </Link>
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

      <Card>
        <CardHeader>
          <CardTitle>Assessment History</CardTitle>
          <CardDescription>
            All diagnostics completed by your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : assessments.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-10 text-center">
              <p className="font-medium">No assessments yet</p>
              <p className="text-sm text-muted-foreground">
                Start your first AI competitiveness diagnostic to see it here.
              </p>
              <Link href="/assessments/new">
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Start New Assessment
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assessment</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Overall Score</TableHead>
                  <TableHead>Maturity</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assessments.map((assessment) => (
                  <TableRow key={assessment.id}>
                    <TableCell className="font-medium">
                      {assessment.name}
                    </TableCell>
                    <TableCell>
                      {new Date(assessment.date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          assessment.status === "completed"
                            ? "default"
                            : assessment.status === "in-progress"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {assessment.status === "completed"
                          ? "Completed"
                          : assessment.status === "in-progress"
                            ? "In Progress"
                            : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {assessment.status === "completed" ? (
                        <>
                          <span className="text-lg font-semibold">
                            {assessment.overallScore.toFixed(1)}
                          </span>
                          <span className="text-muted-foreground"> / 5.0</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {assessment.status === "completed" ? (
                        <Badge variant="outline">
                          {getMaturityLevel(assessment.overallScore)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {assessment.status === "completed" ? (
                        <Link href={`/assessments/${assessment.id}/results`}>
                          <Button variant="ghost" size="sm">
                            View Results
                            <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        </Link>
                      ) : (
                        <Link href={`/assessments/${assessment.id}`}>
                          <Button variant="ghost" size="sm">
                            Continue
                            <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
