import { getProjects } from "../../lib/notion";

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    console.log("🔍 API /API/projects called...");
    console.log("🌍 Environment check:");
    console.log("- NOTION_TOKEN exists:", !!process.env.NOTION_TOKEN);
    console.log(
      "- NOTION_DATABASE_ID exists:",
      !!process.env.NOTION_DATABASE_ID
    );
    console.log(
      "- NOTION_DATABASE_ID value:",
      process.env.NOTION_DATABASE_ID?.substring(0, 8) + "..."
    );

    const projects = await getProjects();

    console.log("✅ Projects fetched successfully:", {
      count: projects.length,
      sample: projects[0]
        ? {
            id: projects[0].id,
            title: projects[0].title,
            hasImage: !!projects[0].image,
          }
        : "No projects",
    });

    res.status(200).json(projects);
  } catch (error) {
    console.error("❌ API /API/projects Error:");
    console.error("- Message:", error.message);
    console.error("- Stack:", error.stack);

    res.status(500).json({
      success: false,
      message: "Failed to fetch projects",
      error: error.message,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
}
