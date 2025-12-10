// app/page.tsx
"use client";

import { useEffect, useState } from "react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SentimentOverview } from "@/components/ui/sentiment-overview";

interface Review {
  id: string;
  source: string;
  overall_sentiment: "Positive" | "Neutral" | "Negative" | string;
  original_complaint: string;
  detected_language: string;
  created_ts: string;

  timeliness: "Positive" | "Neutral" | "Negative" | "NotMentioned" | string;
  order_completeness:
    | "Positive"
    | "Neutral"
    | "Negative"
    | "NotMentioned"
    | string;
  driver_behavior:
    | "Positive"
    | "Neutral"
    | "Negative"
    | "NotMentioned"
    | string;
  cleaning_quality:
    | "Positive"
    | "Neutral"
    | "Negative"
    | "NotMentioned"
    | string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const QUICK_QUESTIONS = [
  "Why are customers unhappy with delivery times?",
  "Summarize the main complaints from the last week.",
  "What are customers most satisfied with?",
  "Which aspects have the most negative sentiment?",
  "Are there any recurring issues with drivers?",
];

type AspectKey =
  | "timeliness"
  | "order_completeness"
  | "driver_behavior"
  | "cleaning_quality";

const aspectLabels: Record<AspectKey, string> = {
  timeliness: "Timeliness",
  order_completeness: "Order completeness",
  driver_behavior: "Driver behavior",
  cleaning_quality: "Cleaning quality",
};

export default function DashboardPage() {
  // Reviews
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ask your data
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);

  // Filters
  const [sentimentFilter, setSentimentFilter] = useState<
    "All" | "Positive" | "Neutral" | "Negative"
  >("All");
  const [search, setSearch] = useState("");

  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const [selectedAspect, setSelectedAspect] = useState<AspectKey | "overall">(
    "overall"
  );

  useEffect(() => {
    async function fetchReviews() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${API_BASE_URL}/api/reviews/`);
        if (!res.ok) {
          throw new Error(`Request failed with status ${res.status}`);
        }
        const data = await res.json();
        setReviews(data);
      } catch (err) {
        console.error(err);
        setError("Could not load reviews.");
      } finally {
        setLoading(false);
      }
    }

    fetchReviews();
  }, []);

  // Ask handler (supports manual + quick questions)
  async function handleAsk(preset?: string) {
    const base = preset ?? question;
    const trimmed = base.trim();
    if (!trimmed) return;

    try {
      setAsking(true);
      setAskError(null);
      setAnswer(null);

      if (preset) {
        setQuestion(trimmed);
      }

      const res = await fetch(`${API_BASE_URL}/api/ask/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });

      if (!res.ok) {
        throw new Error(`Ask failed with status ${res.status}`);
      }

      const data = await res.json();
      setAnswer(data.answer || "No answer returned.");
    } catch (err) {
      console.error(err);
      setAskError("Could not get an answer from the backend.");
    } finally {
      setAsking(false);
    }
  }

  // Apply filters
  const filteredReviews = reviews.filter((r) => {
    const matchesSentiment =
      sentimentFilter === "All" || r.overall_sentiment === sentimentFilter;

    const haystack = (
      (r.original_complaint || "") +
      " " +
      (r.source || "") +
      " " +
      (r.detected_language || "")
    ).toLowerCase();

    const matchesSearch =
      !search.trim() || haystack.includes(search.trim().toLowerCase());

    // Date range logic
    let matchesDate = true;

    if (dateFrom || dateTo) {
      const created = r.created_ts ? new Date(r.created_ts) : null;

      if (!created || isNaN(created.getTime())) {
        // If we have a date filter but no valid date on the review, exclude it
        matchesDate = false;
      } else {
        if (dateFrom) {
          const fromDate = new Date(dateFrom);
          if (created < fromDate) matchesDate = false;
        }
        if (dateTo) {
          const toDate = new Date(dateTo);
          // make "to" inclusive to end of that day
          toDate.setHours(23, 59, 59, 999);
          if (created > toDate) matchesDate = false;
        }
      }
    }

    return matchesSentiment && matchesSearch && matchesDate;
  });

  // Sentiment counts (based on filtered)
  const total = filteredReviews.length;
  const positives = filteredReviews.filter(
    (r) => r.overall_sentiment === "Positive"
  ).length;
  const negatives = filteredReviews.filter(
    (r) => r.overall_sentiment === "Negative"
  ).length;
  const neutrals = filteredReviews.filter(
    (r) => r.overall_sentiment === "Neutral"
  ).length;

    // Aspect stats (filtered)
  const aspectStats = (
    [
      "timeliness",
      "order_completeness",
      "driver_behavior",
      "cleaning_quality",
    ] as AspectKey[]
  ).map((key) => {
    const mentioned = filteredReviews.filter(
      (r) => r[key] && r[key] !== "NotMentioned"
    );
    const totalMentioned = mentioned.length;

    const negative = mentioned.filter((r) => r[key] === "Negative").length;
    const positive = mentioned.filter((r) => r[key] === "Positive").length;
    const neutral = mentioned.filter((r) => r[key] === "Neutral").length;

    return {
      key,
      label: aspectLabels[key],
      totalMentioned,
      negative,
      positive,
      neutral,
    };
  });

  const negativeShare = 
    total > 0 ? Math.round((negatives / total)* 100) : null;

  const netSentiment =
    total > 0 ? Math.round(((positives - negatives) / total) * 100) : null;

  const worstAspect = aspectStats.reduce<
    { label: string; negative: number} | null
  >((worst, a) => {
    if(a.negative === 0) return worst;
    if(!worst || a.negative > worst.negative) {
      return { label: a.label, negative: a.negative };
    }
    return worst;
  }, null);

  const isFiltered =
    sentimentFilter !== "All" ||
    search.trim().length > 0 ||
    dateFrom !== "" ||
    dateTo !== "";

  const kpis = [
    {
      id: "total",
      label: "Total reviews",
      value: total.toString(),
      helper: isFiltered ? "Within current filters" : "All reviews",
    },
    {
      id: "negativeShare",
      label: "Negative share",
      value: total > 0 && negativeShare !== null ? `${negativeShare}%` : "-",
      helper: total > 0 ? "Share of reviews that are negative" : "No data",
    },
    {
      id: "netSentiment",
      label: "Net sentiment",
      value: netSentiment !== null ? `${netSentiment}` : "—",
      helper: "Scale -100 (all negative) to +100 (all positive)",
    },
    {
      id: "topPainPoint",
      label: "Top pain point",
      value: worstAspect ? worstAspect.label : "None",
      helper: worstAspect
        ? `${worstAspect.negative} negative mentions`
        : "No aspect stands out negatively",
    },
  ];

  const overallCounts = {
    positive: positives,
    neutral: neutrals,
    negative: negatives,
  };

  const selectedAspectStats = 
    selectedAspect === "overall"
    ? null
    : aspectStats.find((a) => a.key === selectedAspect) || null;

  const chartCounts = selectedAspectStats
    ? {
        positive: selectedAspectStats.positive,
        neutral: selectedAspectStats.neutral,
        negative: selectedAspectStats.negative,
      }
    : overallCounts;

  const chartTitle = selectedAspectStats
      ? `${selectedAspectStats.label} sentiment`
      : "Sentiment breakdown";
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
        {/* Header */}
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-[2rem] md:text-[2.5rem] leading-[1.2] font-bold">
              SLaundry AIOps Dashboard
            </h1>
            <p className="mt-1 text-[0.875rem] text-slate-600">
              Customer feedback, Sentiment Analysis, and AI
              insights.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex h-8 items-center rounded-full bg-snoonu-red px-4 text-[0.75rem] font-medium text-white">
              Snoonu Internal
            </span>
            <Badge variant="outline" className="px-4 py-1 text-[0.75rem]">
              MVP · Local
            </Badge>
          </div>
        </header>

        {/* KPI Cards */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Overview</h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((kpi) => (
              <Card
                key={kpi.id}
                className="shadow-sm"
              >
                <CardHeader className="pb-1">
                  <CardTitle className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                    {kpi.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl md:text-3xl font-semibold">
                    {kpi.value}
                  </div>
                  {kpi.helper && (
                    <p className="mt-1 text-xs text-slate-500">{kpi.helper}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>


        {/* Sentiment chart */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-800">Sentiment Analysis</h2>
          <SentimentOverview counts ={chartCounts} title={chartTitle} />
        </section>

        {/* Aspect-level overview */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-800">Aspect Breakdown</h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {aspectStats.map((a) => (
            <Card
              key={a.key}
              role = "button"
              tabIndex={0}
              onClick={() =>
                setSelectedAspect((prev) => (prev === a.key ? "overall" : a.key))
              }
              className={"bg-white border-slate-200 shadow-sm cursor-pointer transition-colors" +
                (selectedAspect === a.key
                  ? "border-blue-500 bg-blue-50"
                  : "hover:border-slate-200 hover:bg-slate-50"
                )
              }
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-700">
                  {a.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-2xl font-bold text-slate-900">
                  {a.totalMentioned}
                  <span className="text-sm font-normal text-slate-500 ml-2">
                    mentions
                  </span>
                </div>
                <div className="flex flex-col gap-1.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Negative</span>
                    <span className="font-semibold text-snoonu-red">{a.negative}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Positive</span>
                    <span className="font-semibold text-snoonu-green">{a.positive}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Neutral</span>
                    <span className="font-semibold text-slate-700">{a.neutral}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          </div>
        </section>

        {/* Ask + Filters row */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-800">AI Assistant & Filters</h2>
          <div className="grid gap-4 lg:grid-cols-3">
          {/* Ask your data */}
          <Card className="bg-white border-slate-200 shadow-sm lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Ask your data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Example: Why did timeliness complaints increase this week?"
                className="min-h-[80px] text-sm"
              />

              {/* Quick questions */}
              <div className="flex flex-wrap gap-2">
                {QUICK_QUESTIONS.map((q) => (
                  <Button
                    key={q}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-[11px] h-8"
                    disabled={asking}
                    onClick={() => handleAsk(q)}
                  >
                    {q}
                  </Button>
                ))}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  variant="default"
                  className="w-full sm:w-auto px-6 text-sm"
                  onClick={() => handleAsk()}
                  disabled={asking || !question.trim()}
                >
                  {asking ? "Asking…" : "Ask"}
                </Button>

                {askError && (
                  <p className="text-[11px] text-red-500">{askError}</p>
                )}
                {!askError && !answer && (
                  <p className="text-[11px] text-slate-500">
                    Ask a question about recent reviews, or use a quick query
                    above.
                  </p>
                )}
              </div>

              {answer && (
                <div className="mt-1 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 whitespace-pre-wrap">
                  {answer}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Filters */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Search by text, source, or language…"
                className="text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-slate-500">From date</span>
                  <Input
                    type="date"
                    className="text-sm"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                   />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-slate-500">To date</span>
                  <Input
                    type="date"
                    className="text-sm"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                {["All", "Positive", "Neutral", "Negative"].map((label) => {
                  const active = sentimentFilter === label;
                  return (
                    <Badge
                      key={label}
                      variant={active ? "default" : "secondary"}
                      className="px-3 py-1 cursor-pointer"
                      onClick={() =>
                        setSentimentFilter(
                          label as "All" | "Positive" | "Neutral" | "Negative"
                        )
                      }
                    >
                      {label}
                    </Badge>
                  );
                })}
              </div>


              <p className="text-[11px] text-slate-500">
                Filters apply to both the KPIs and the table.
              </p>
            </CardContent>
          </Card>
          </div>
        </section>

        {/* Reviews table */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-800">Review Details</h2>
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Recent Reviews
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading && (
                <div className="p-4 text-xs text-slate-500">
                  Loading reviews…
                </div>
              )}

              {error && !loading && (
                <div className="p-4 text-xs text-red-500">{error}</div>
              )}

              {!loading && !error && (
                <div className="max-h-[420px] overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white">
                      <TableRow>
                        <TableHead className="w-[140px] text-[11px] uppercase tracking-wide text-slate-500">
                          Source
                        </TableHead>
                        <TableHead className="text-[11px] uppercase tracking-wide text-slate-500">
                          Text
                        </TableHead>
                        <TableHead className="w-[120px] text-[11px] uppercase tracking-wide text-slate-500">
                          Sentiment
                        </TableHead>
                        <TableHead className="w-[60px] text-[11px] uppercase tracking-wide text-slate-500">
                          Lang
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReviews.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="text-xs md:text-sm text-slate-700">
                            {r.source}
                          </TableCell>
                          <TableCell className="text-xs md:text-sm text-slate-900">
                            {r.original_complaint}
                          </TableCell>
                          <TableCell className="text-xs md:text-sm">
                            <Badge
                              variant="outline"
                              className={
                                r.overall_sentiment === "Negative"
                                  ? "border-snoonu-red text-snoonu-red"
                                  : r.overall_sentiment === "Positive"
                                  ? "border-snoonu-green text-snoonu-green"
                                  : "border-slate-400 text-slate-700"
                              }
                            >
                              {r.overall_sentiment}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs md:text-sm text-slate-500">
                            {r.detected_language}
                          </TableCell>
                        </TableRow>
                      ))}

                      {filteredReviews.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center text-xs py-6 text-slate-500"
                          >
                            No reviews found for the current filters.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
