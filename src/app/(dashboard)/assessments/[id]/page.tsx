"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  dimensions,
  dimensionDescriptions,
  scaleLabels,
  type Dimension,
  type Question,
} from "@/lib/data/questions";
import {
  completeAssessment,
  createAssessment,
  getAssessment,
  getResponses,
  listQuestions,
  saveResponse,
} from "@/lib/data/api";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";

export default function AssessmentQuestionnairePage() {
  const params = useParams();
  const router = useRouter();
  const idParam = typeof params.id === "string" ? params.id : "";

  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [activeDimension, setActiveDimension] = useState<string>("Strategy");
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const initRef = useRef(false);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  // Answers whose saveResponse call failed (latest value per question) so
  // completion can retry them instead of silently completing with missing rows.
  const failedSavesRef = useRef(
    new Map<string, { question: Question; value: number }>()
  );

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    (async () => {
      try {
        const loadedQuestions = await listQuestions();
        setQuestions(loadedQuestions);
        if (idParam === "new") {
          const created = await createAssessment();
          setAssessmentId(created.id);
          router.replace(`/assessments/${created.id}`);
        } else {
          const existing = await getAssessment(idParam);
          if (!existing) {
            setError("Assessment not found.");
            return;
          }
          if (existing.status === "completed") {
            router.replace(`/assessments/${idParam}/results`);
            return;
          }
          setAssessmentId(idParam);
          setResponses(await getResponses(idParam));
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load the assessment");
      } finally {
        setLoading(false);
      }
    })();
  }, [idParam, router]);

  const questionsByDimension = useMemo(() => {
    const map = new Map<Dimension, Question[]>();
    dimensions.forEach((dim) => map.set(dim, []));
    questions.forEach((q) => map.get(q.dimension)?.push(q));
    return map;
  }, [questions]);

  const getDimensionQuestions = (dim: Dimension): Question[] =>
    questionsByDimension.get(dim) ?? [];

  const totalQuestions = questions.length;
  const answeredQuestions = Object.keys(responses).length;
  const progressPercent = totalQuestions
    ? Math.round((answeredQuestions / totalQuestions) * 100)
    : 0;

  const handleResponse = (question: Question, value: number) => {
    setResponses((prev) => ({ ...prev, [question.id]: value }));
    if (!assessmentId) return;
    setSaveError(null);
    saveQueueRef.current = saveQueueRef.current
      .then(() => saveResponse(assessmentId, question, value))
      .then(() => {
        failedSavesRef.current.delete(question.id);
      })
      .catch((e) => {
        failedSavesRef.current.set(question.id, { question, value });
        setSaveError(
          e instanceof Error ? e.message : "Failed to save your answer"
        );
      });
  };

  const currentDimensionIndex = dimensions.indexOf(activeDimension as Dimension);

  const handleNext = () => {
    if (currentDimensionIndex < dimensions.length - 1) {
      setActiveDimension(dimensions[currentDimensionIndex + 1]);
    }
  };

  const handlePrevious = () => {
    if (currentDimensionIndex > 0) {
      setActiveDimension(dimensions[currentDimensionIndex - 1]);
    }
  };

  const handleComplete = async () => {
    if (!assessmentId) return;
    setCompleting(true);
    setError(null);
    try {
      await saveQueueRef.current;
      // Re-attempt any answers that previously failed to persist. If a retry
      // fails again we throw, blocking completion, so the assessments row can
      // never count answers that were never written to assessment_responses.
      for (const [questionId, failed] of Array.from(
        failedSavesRef.current.entries()
      )) {
        await saveResponse(assessmentId, failed.question, failed.value);
        failedSavesRef.current.delete(questionId);
      }
      setSaveError(null);
      await completeAssessment(assessmentId, questions, responses);
      router.push(`/assessments/${assessmentId}/results`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to complete the assessment");
      setCompleting(false);
    }
  };

  const isComplete = totalQuestions > 0 && answeredQuestions === totalQuestions;

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Competitiveness Diagnostic</h1>
          <p className="text-muted-foreground">
            Rate your organization across 6 dimensions of AI readiness
          </p>
        </div>
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error && !assessmentId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Competitiveness Diagnostic</h1>
          <p className="text-muted-foreground">
            Rate your organization across 6 dimensions of AI readiness
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
        <Link href="/assessments">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Assessments
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Competitiveness Diagnostic</h1>
        <p className="text-muted-foreground">
          Rate your organization across 6 dimensions of AI readiness
        </p>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="ml-auto text-sm text-muted-foreground tabular-nums">
              {answeredQuestions} / {totalQuestions} questions ({progressPercent}%)
            </span>
          </div>
          <Progress value={progressPercent} />
        </CardContent>
      </Card>

      {(error || saveError) && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error || saveError}</span>
        </div>
      )}

      {/* Dimension Tabs */}
      <Tabs
        value={activeDimension}
        onValueChange={(v) => {
          // Ignore null/undefined — every value we render is a valid dimension.
          if (typeof v === "string") setActiveDimension(v);
        }}
      >
        <TabsList className="w-full grid grid-cols-3 lg:grid-cols-6">
          {dimensions.map((dim) => {
            const dimQuestions = getDimensionQuestions(dim);
            const dimAnswered = dimQuestions.filter((q) => responses[q.id] !== undefined).length;
            const allAnswered = dimQuestions.length > 0 && dimAnswered === dimQuestions.length;
            return (
              <TabsTrigger key={dim} value={dim} className="relative">
                {dim}
                {allAnswered && (
                  <CheckCircle2 className="ml-1 h-3 w-3 text-emerald-500" />
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {dimensions.map((dim) => {
          const dimQuestions = getDimensionQuestions(dim);
          return (
            <TabsContent key={dim} value={dim}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{dim}</CardTitle>
                      <CardDescription>
                        {dimensionDescriptions[dim]}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">
                      {dimQuestions.filter((q) => responses[q.id] !== undefined).length} / {dimQuestions.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {dimQuestions.map((question, index) => (
                      <div key={question.id} className="space-y-3">
                        <div>
                          <p className="font-medium">
                            <span className="text-muted-foreground mr-2">
                              {index + 1}.
                            </span>
                            {question.text}
                          </p>
                          {question.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {question.description}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {[1, 2, 3, 4, 5].map((value) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => handleResponse(question, value)}
                              className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
                                responses[question.id] === value
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border hover:border-primary/50 hover:bg-muted"
                              }`}
                            >
                              <span className="font-bold">{value}</span>
                              <span className="hidden sm:inline text-xs opacity-80">
                                {scaleLabels[value]}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Navigation */}
              <div className="mt-6 flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentDimensionIndex === 0}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>

                {currentDimensionIndex < dimensions.length - 1 ? (
                  <Button onClick={handleNext}>
                    Next Dimension
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleComplete}
                    disabled={!isComplete || completing}
                    className={isComplete ? "" : "opacity-50"}
                  >
                    {completing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                    )}
                    {completing ? "Saving…" : "Complete Assessment"}
                  </Button>
                )}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
