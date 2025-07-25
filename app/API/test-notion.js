import { getProjects, testNotionConnection } from "../../lib/notion";

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
    console.log("🧪 API /API/test-notion called...");

    // Environment variables check
    const envCheck = {
      NOTION_TOKEN: !!process.env.NOTION_TOKEN,
      NOTION_DATABASE_ID: !!process.env.NOTION_DATABASE_ID,
      NODE_ENV: process.env.NODE_ENV,
    };

    console.log("🌍 Environment Variables:", envCheck);

    if (!process.env.NOTION_TOKEN) {
      throw new Error("NOTION_TOKEN environment variable is missing");
    }

    if (!process.env.NOTION_DATABASE_ID) {
      throw new Error("NOTION_DATABASE_ID environment variable is missing");
    }

    // Test connection
    console.log("🔗 Testing Notion connection...");
    const connectionTest = await testNotionConnection();

    if (!connectionTest.success) {
      throw new Error(`Connection test failed: ${connectionTest.error}`);
    }

    // Test data fetch
    console.log("📊 Testing data fetch...");
    const projects = await getProjects();

    const response = {
      success: true,
      message: "Notion connection and data fetch successful! 🎉",
      timestamp: new Date().toISOString(),
      environment: envCheck,
      connection: connectionTest,
      data: {
        projectCount: projects.length,
        sampleProjects: projects.slice(0, 3).map((p) => ({
          id: p.id,
          title: p.title,
          hasDescription: !!p.description,
          hasImage: !!p.image,
          techStackCount: p.stack?.length || 0,
          hasFeatures: !!p.features,
        })),
      },
    };

    console.log("✅ Test completed successfully:", {
      projectCount: projects.length,
      connectionSuccess: connectionTest.success,
    });

    res.status(200).json(response);
  } catch (error) {
    console.error("❌ API /API/test-notion Error:");
    console.error("- Message:", error.message);
    console.error("- Code:", error.code);
    console.error("- Stack:", error.stack);

    const errorResponse = {
      success: false,
      message: "Notion connection test failed! ❌",
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        code: error.code,
        type: error.name,
      },
      environment: {
        NOTION_TOKEN: !!process.env.NOTION_TOKEN,
        NOTION_DATABASE_ID: !!process.env.NOTION_DATABASE_ID,
        NODE_ENV: process.env.NODE_ENV,
      },
      troubleshooting: {
        common_issues: [
          "Make sure NOTION_TOKEN is set in .env.local",
          "Make sure NOTION_DATABASE_ID is set in .env.local",
          "Ensure the integration has access to the database",
          "Check if the database ID is correct",
          "Verify the Notion integration has the right permissions",
        ],
      },
    };

    if (process.env.NODE_ENV === "development") {
      errorResponse.debug = {
        stack: error.stack,
        databaseId: process.env.NOTION_DATABASE_ID,
      };
    }

    res.status(500).json(errorResponse);
  }
}
