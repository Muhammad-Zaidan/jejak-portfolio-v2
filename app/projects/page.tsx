// app/projects/page.tsx
import { getProjects } from "@/lib/notion";
import Projects from "@/Components/layout/Projects";

export default async function ProjectsPage() {
  const projects = await getProjects(); // ini fetch server-side

  return <Projects projects={projects} />;
}
