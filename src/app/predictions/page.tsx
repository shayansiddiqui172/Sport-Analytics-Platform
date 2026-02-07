"use client";

import { motion } from "framer-motion";
import { Trophy, RefreshCw, AlertCircle } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, Skeleton, Button } from "@/components/ui";
import { useAwardPredictions } from "@/hooks/useNBAData";
import { AwardCard } from "@/components/predictions/award-card";

export default function PredictionsPage() {
  const {
    data: awardsData,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useAwardPredictions();

  const awards = awardsData?.data || [];
  const meta = awardsData?.meta;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">NBA Award Predictions</h1>
            {isFetching && !isLoading && (
              <RefreshCw className="w-5 h-5 text-primary animate-spin" />
            )}
          </div>
          <p className="text-text-secondary">
            Top candidates for major NBA awards based on real sportsbook futures odds
          </p>
        </div>

        {/* Error State */}
        {error && (
          <Card className="bg-danger/10 border-danger/30 mb-8">
            <CardContent className="py-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-danger font-semibold mb-2">
                    Error Loading Predictions
                  </h3>
                  <p className="text-text-secondary text-sm mb-4">
                    Failed to load award odds data. This might be due to API
                    rate limiting or market availability.
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => refetch()}
                    className="gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retry
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <AwardCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <>
            {/* Awards Grid - 3 columns for MVP, Champion, ROTY */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {awards.map((award, index) => (
                <AwardCard key={award.key} award={award} index={index} />
              ))}
            </div>

            {/* Footer Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-10"
            >
              <Card className="bg-surface/50">
                <CardContent className="py-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center shrink-0">
                      <Trophy className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">About These Predictions</h3>
                      <p className="text-sm text-text-secondary mb-3">
                        Championship and Rookie of the Year odds are powered by real sportsbook futures (DraftKings).
                        MVP predictions use stat-based probability models calculated from current season performance.
                      </p>
                      <div className="flex flex-wrap gap-3 text-xs text-text-muted">
                        {meta?.fetched_at && (
                          <span>
                            Last updated:{" "}
                            {new Date(meta.fetched_at).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                        {meta && (
                          <span>
                            {meta.categories_with_data} of {meta.total_categories}{" "}
                            categories available
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </main>
    </div>
  );
}

function AwardCardSkeleton() {
  return (
    <Card variant="elevated" className="h-full">
      <CardContent className="py-6">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div>
            <Skeleton className="h-5 w-24 mb-1" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="h-6 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
