import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { project_path, source_type, project_id } = await req.json();

    if (!project_path) {
      return new Response(
        JSON.stringify({ error: "project_path is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isGitRepo = source_type === "git" || project_path.includes("github.com") || project_path.includes("gitlab.com");

    // Simulate scanning a project structure
    // In a real deployment, this would read the actual filesystem or clone the repo
    const techStack: string[] = [];
    const entryPoints: string[] = [];
    const dependencyGraph: Record<string, string[]> = {};
    const documentation: any[] = [];
    const fileTree: any = { name: "root", type: "dir", children: [] };

    // Detect tech stack from path patterns
    const pathLower = project_path.toLowerCase();
    if (pathLower.includes("package.json") || pathLower.includes("node") || pathLower.endsWith(".js") || pathLower.endsWith(".ts")) {
      techStack.push("JavaScript/TypeScript", "Node.js");
      entryPoints.push("src/index.js", "src/app.js", "package.json");
      dependencyGraph["root"] = ["package.json", "src/", "node_modules/"];
    }
    if (pathLower.includes("requirements") || pathLower.includes(".py") || pathLower.includes("python")) {
      techStack.push("Python");
      entryPoints.push("main.py", "app.py", "requirements.txt");
      dependencyGraph["root"] = ["requirements.txt", "main.py", "src/"];
    }
    if (pathLower.includes("pom.xml") || pathLower.includes(".java") || pathLower.includes("maven")) {
      techStack.push("Java", "Maven");
      entryPoints.push("pom.xml", "src/main/java/");
      dependencyGraph["root"] = ["pom.xml", "src/main/java/"];
    }
    if (pathLower.includes("cargo.toml") || pathLower.includes(".rs") || pathLower.includes("rust")) {
      techStack.push("Rust", "Cargo");
      entryPoints.push("Cargo.toml", "src/main.rs");
      dependencyGraph["root"] = ["Cargo.toml", "src/"];
    }
    if (pathLower.includes("go.mod") || pathLower.includes(".go")) {
      techStack.push("Go");
      entryPoints.push("main.go", "go.mod");
      dependencyGraph["root"] = ["go.mod", "main.go"];
    }

    // If no specific tech detected, add generic
    if (techStack.length === 0) {
      techStack.push("Unknown / Generic");
      entryPoints.push("README.md", "main entry file");
      dependencyGraph["root"] = ["README.md"];
    }

    // Build a representative file tree
    fileTree.children = [
      { name: "README.md", type: "file", size: 2048 },
      { name: "src", type: "dir", children: [
        { name: "index.js", type: "file", size: 1024 },
        { name: "app.js", type: "file", size: 4096 },
        { name: "components", type: "dir", children: [
          { name: "Header.js", type: "file", size: 2048 },
          { name: "Footer.js", type: "file", size: 1024 },
        ]},
      ]},
      { name: "tests", type: "dir", children: [
        { name: "index.test.js", type: "file", size: 2048 },
      ]},
      { name: "docs", type: "dir", children: [
        { name: "api.md", type: "file", size: 4096 },
      ]},
    ];

    documentation.push({
      path: "README.md",
      summary: "Project README with setup instructions and overview.",
      type: "readme"
    });

    if (isGitRepo) {
      documentation.push({
        path: ".git/config",
        summary: "Git repository configuration.",
        type: "git_config"
      });
    }

    const rawSummary = `Project at ${project_path} appears to use ${techStack.join(", ")}. ` +
      `Entry points: ${entryPoints.join(", ")}. ` +
      `Detected ${documentation.length} documentation files. ` +
      `Source type: ${isGitRepo ? "Git repository" : "Local folder"}.`;

    const result = {
      tech_stack: techStack,
      entry_points: entryPoints,
      dependency_graph: dependencyGraph,
      file_tree: fileTree,
      documentation,
      raw_summary: rawSummary,
      project_id
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
