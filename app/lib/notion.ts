// lib/notion.ts - Versi dengan debugging dan error handling yang lebih baik

import { Client } from "@notionhq/client";

// Validasi environment variables
if (!process.env.NOTION_TOKEN) {
  throw new Error("NOTION_TOKEN environment variable is required");
}

if (!process.env.NOTION_DATABASE_ID) {
  throw new Error("NOTION_DATABASE_ID environment variable is required");
}

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const databaseId = process.env.NOTION_DATABASE_ID;

export async function getProjects() {
  try {
    console.log("🔍 Querying Notion database:", databaseId);

    const res = await notion.databases.query({
      database_id: databaseId,
      // Tambahkan sort jika diperlukan
      sorts: [
        {
          timestamp: "created_time",
          direction: "descending",
        },
      ],
    });

    console.log("📡 Notion API Response:");
    console.log("- Results count:", res.results.length);
    console.log("- Has more:", res.has_more);
    console.log("- Next cursor:", res.next_cursor);

    if (res.results.length === 0) {
      console.warn("⚠️ No results found in database");
      return [];
    }

    const projects = res.results.map((page: any, index: number) => {
      console.log(`🔄 Processing page ${index + 1}:`, page.id);

      const properties = page.properties;
      console.log("📋 Available properties:", Object.keys(properties));

      // Helper function untuk extract text dengan error handling
      const extractText = (property: any, fallback: string = "") => {
        try {
          if (!property) return fallback;

          if (property.type === "title" && property.title) {
            return property.title[0]?.plain_text || fallback;
          }

          if (property.type === "rich_text" && property.rich_text) {
            return property.rich_text[0]?.plain_text || fallback;
          }

          return fallback;
        } catch (error) {
          console.warn(`Failed to extract text from property:`, error);
          return fallback;
        }
      };

      // Helper function untuk extract image URL
      const extractImage = (property: any) => {
        try {
          if (!property || !property.files || property.files.length === 0) {
            return null;
          }

          const file = property.files[0];

          if (file.type === "external") {
            return file.external?.url || null;
          } else if (file.type === "file") {
            return file.file?.url || null;
          }

          return null;
        } catch (error) {
          console.warn(`Failed to extract image:`, error);
          return null;
        }
      };

      // Helper function untuk extract multi-select
      const extractMultiSelect = (property: any) => {
        try {
          if (!property || !property.multi_select) {
            return [];
          }

          return property.multi_select.map((item: any) => item.name) || [];
        } catch (error) {
          console.warn(`Failed to extract multi-select:`, error);
          return [];
        }
      };

      const project = {
        id: page.id,
        title: extractText(properties["Judul"], `Project ${index + 1}`),
        description: extractText(
          properties["Description"],
          "No description available"
        ),
        image: extractImage(properties["Gambar"]),
        stack: extractMultiSelect(properties["Stack"]),
        features: extractText(properties["Fitur"]),
      };

      console.log(`✅ Processed project:`, {
        id: project.id,
        title: project.title,
        hasImage: !!project.image,
        stackCount: project.stack.length,
        hasFeatures: !!project.features,
      });

      return project;
    });

    console.log(`🎉 Successfully processed ${projects.length} projects`);
    return projects;
  } catch (error: any) {
    console.error("💥 Error in getProjects():");
    console.error("- Message:", error.message);
    console.error("- Code:", error.code);
    console.error("- Status:", error.status);

    // Notion API specific errors
    if (error.code === "object_not_found") {
      throw new Error(
        `Database not found. Check your NOTION_DATABASE_ID: ${databaseId}`
      );
    }

    if (error.code === "unauthorized") {
      throw new Error(
        "Unauthorized access to Notion. Check your NOTION_TOKEN and database permissions."
      );
    }

    if (error.code === "restricted_resource") {
      throw new Error(
        "The integration does not have access to this database. Make sure to share the database with your integration."
      );
    }

    throw error;
  }
}

// Tambahan function untuk test koneksi
export async function testNotionConnection() {
  try {
    console.log("🧪 Testing Notion connection...");

    // Test basic connection
    const response = await notion.databases.retrieve({
      database_id: databaseId,
    });

    console.log("✅ Database found:", {
      id: response.id,
      title: response.title,
      created_time: response.created_time,
      properties: Object.keys(response.properties),
    });

    return {
      success: true,
      database: {
        id: response.id,
        title: response.title,
        properties: Object.keys(response.properties),
      },
    };
  } catch (error: any) {
    console.error("❌ Connection test failed:", error);
    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }
}
