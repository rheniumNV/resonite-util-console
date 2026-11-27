import React, { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import _ from "lodash";
import { fetcher } from "../../../src/helper";
import SessionCard from "./SessionCard";
import { Alert, Box, CircularProgress, Grid, Container } from "@mui/material";

// 初回に表示する件数と、スクロールで追加する件数
const PAGE_SIZE = 20;

export default function Index() {
  const { data: sessions, error } = useSWR<any[]>(
    "/api/session/v1/list?rejectKeys=tags",
    fetcher
  );

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasMore = visibleCount < _.size(sessions);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;
    // 表示件数が増えるたびに監視し直すので、追加後も末尾が見えていれば続けて読み込む
    const observer = new IntersectionObserver(
      (entries) => {
        if (_.some(entries, "isIntersecting")) {
          setVisibleCount((count) => count + PAGE_SIZE);
        }
      },
      { rootMargin: "400px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, visibleCount]);

  return (
    <Container sx={{ paddingTop: 6, paddingBottom: 6 }}>
      {error && (
        <Alert severity="error" sx={{ marginBottom: 2 }}>
          Failed to load sessions. Please try again later.
        </Alert>
      )}
      <Grid container spacing={2}>
        {_.map(_.take(sessions ?? [], visibleCount), (session, index) => {
          return (
            <Grid item key={session.sessionId ?? index}>
              <SessionCard session={session}></SessionCard>
            </Grid>
          );
        })}
      </Grid>
      {hasMore && (
        <Box
          ref={sentinelRef}
          sx={{ display: "flex", justifyContent: "center", paddingTop: 4 }}
        >
          <CircularProgress />
        </Box>
      )}
    </Container>
  );
}
