/**
 * Prerender Entry Point
 * Used during build to generate static HTML for each route
 */
import React from "react";
import ReactDOMServer from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { App } from "@/components/app";
import { Providers } from "@/components/providers";
import "./index.css";

// Routes to prerender
export const routes = ["/", "/dashboard", "/auth/signin", "/auth/signup", "/account/profile"];

interface PrerenderParams {
  url: string;
  template: string;
}

export function render({ url, template }: PrerenderParams): string {
  const appHtml = ReactDOMServer.renderToString(
    <StaticRouter location={url}>
      <Providers>
        <App />
      </Providers>
    </StaticRouter>
  );

  // Inject the rendered HTML into the template
  return template.replace(
    '<div id="root"></div>',
    `<div id="root">${appHtml}</div>`
  );
}

// For ESM compatibility
export default { routes, render };
