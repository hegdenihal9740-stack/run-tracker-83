import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import campuslyCss from "../campusly/campusly.css?url";

// @ts-expect-error untyped JS module
const CampuslyApp = lazy(() => import("../campusly/App.jsx"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Student Portal" },
      { name: "description", content: "Student portal: courses, timetable, attendance, marks, assignments and more." },
      { property: "og:title", content: "Student Portal" },
      { property: "og:description", content: "Student portal: courses, timetable, attendance, marks, assignments and more." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap" },
      { rel: "stylesheet", href: campuslyCss },
    ],
  }),
  component: Index,
});

function Index() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return (
    <Suspense fallback={null}>
      <CampuslyApp />
    </Suspense>
  );
}
