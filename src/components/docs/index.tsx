import { useState, useEffect } from "react";
import { ApiReferenceReact } from "@scalar/api-reference-react";
import "@scalar/api-reference-react/style.css";
import { generateHonoSpec, generateAuthSpec } from "./specs";

export function DocsPage() {
  const [honoSpec, setHonoSpec] = useState<any>(null);
  const [authSpec, setAuthSpec] = useState<any>(null);

  useEffect(() => {
    async function loadSpecs() {
      try {
        const [hono, auth] = await Promise.all([
          generateHonoSpec(),
          generateAuthSpec(),
        ]);
        setHonoSpec(hono);
        setAuthSpec(auth);
      } catch (error) {
        console.error("Failed to generate documentation specs:", error);
      }
    }
    loadSpecs();
  }, []);

  if (!honoSpec || !authSpec) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0d0d0d] text-white">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent mx-auto"></div>
          <p className="text-zinc-400">Generetating Documentation...</p>
        </div>
      </div>
    );
  }

  return (
    <ApiReferenceReact
      configuration={{
        sources: [
          {
            title: "API",
            content: honoSpec,
          },
          {
            title: "Auth",
            content: authSpec,
          },
        ],
        layout: "modern",
        theme: "default",
        hideSearch: false,
        showDeveloperTools: "always",
      }}
    />
  );
}
