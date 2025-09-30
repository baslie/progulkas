import { NextResponse } from "next/server";
import React from "react";
import ReactMarkdown from "react-markdown";
import { renderToStaticMarkup } from "react-dom/server";
import remarkGfm from "remark-gfm";
import { generatePdf } from "html-pdf-node";

import { getAudienceLabel, getDifficultyLabel } from "@/lib/routes/constants";
import { getRouteDetailsBySlug } from "@/lib/routes/queries";
import { ROUTE_POI_CATEGORY_META } from "@/lib/routes/poi";
import { formatDistance, formatDuration } from "@/lib/utils";

import type { RouteDetails } from "@/lib/routes/types";

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderMarkdown(markdown: string): string {
  return renderToStaticMarkup(
    React.createElement(ReactMarkdown, { remarkPlugins: [remarkGfm] }, markdown),
  );
}

function buildPdfHtml(route: RouteDetails): string {
  const descriptionHtml = renderMarkdown(route.descriptionMarkdown);
  const factsHtml = route.interestingFacts
    .map((fact) => `<li>${escapeHtml(fact)}</li>`)
    .join("");
  const poiRows = route.pointsOfInterest
    .map((poi) => {
      const categoryMeta = ROUTE_POI_CATEGORY_META[poi.category];
      const categoryLabel = categoryMeta ? categoryMeta.label : poi.category;
      return `
        <tr>
          <td>${escapeHtml(poi.name)}</td>
          <td>${escapeHtml(categoryLabel)}</td>
          <td>${poi.description ? escapeHtml(poi.description) : "&mdash;"}</td>
          <td>${poi.coordinates[1].toFixed(5)}, ${poi.coordinates[0].toFixed(5)}</td>
        </tr>
      `;
    })
    .join("");

  const audienceList = route.suitableFor
    .map((audience) => `<span class="chip">${escapeHtml(getAudienceLabel(audience))}</span>`)
    .join("");

  const tags = route.tags.map((tag) => `#${escapeHtml(tag)}`).join(" &middot; ");

  return `<!DOCTYPE html>
  <html lang="ru">
    <head>
      <meta charSet="utf-8" />
      <title>${escapeHtml(route.title)}</title>
      <style>
        * { box-sizing: border-box; }
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          margin: 0;
          padding: 24px;
          color: #111827;
          background-color: #ffffff;
        }
        header {
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 16px;
          margin-bottom: 24px;
        }
        h1 {
          font-size: 28px;
          margin: 0;
          color: #111827;
        }
        h2 {
          font-size: 18px;
          margin: 32px 0 12px;
          color: #111827;
        }
        h3 {
          font-size: 16px;
          margin: 24px 0 12px;
          color: #111827;
        }
        p {
          line-height: 1.6;
          margin: 12px 0;
          color: #374151;
        }
        .meta {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 12px;
          font-size: 14px;
          color: #4b5563;
        }
        .stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 12px;
          margin: 24px 0;
          padding: 16px;
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
        }
        .stat {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .stat-label {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #6b7280;
        }
        .stat-value {
          font-size: 16px;
          font-weight: 600;
        }
        .section {
          margin-top: 28px;
        }
        .chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .chip {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 9999px;
          background-color: #eff6ff;
          color: #1d4ed8;
          font-size: 12px;
        }
        ul {
          padding-left: 20px;
          color: #374151;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 12px;
          font-size: 12px;
        }
        th, td {
          border: 1px solid #e5e7eb;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f3f4f6;
          font-weight: 600;
        }
        footer {
          margin-top: 36px;
          padding-top: 12px;
          border-top: 1px solid #e5e7eb;
          font-size: 11px;
          color: #6b7280;
        }
        .tags {
          font-size: 12px;
          color: #6b7280;
        }
        .markdown h1, .markdown h2, .markdown h3, .markdown h4 {
          margin: 24px 0 12px;
        }
        .markdown p {
          margin: 12px 0;
        }
        .markdown ul {
          margin: 12px 0;
        }
      </style>
    </head>
    <body>
      <header>
        <h1>${escapeHtml(route.title)}</h1>
        <div class="meta">
          <span>${escapeHtml(route.city)}, ${escapeHtml(route.region)}</span>
          <span>Сложность: ${escapeHtml(getDifficultyLabel(route.difficulty))}</span>
          <span>${route.ratingAverage !== null ? `${route.ratingAverage.toFixed(1)} · ${route.ratingCount} оценок` : `${route.ratingCount} оценок`}</span>
        </div>
        <p>${escapeHtml(route.summary)}</p>
        ${tags ? `<p class="tags">${tags}</p>` : ""}
      </header>
      <section class="stats">
        <div class="stat">
          <span class="stat-label">Длина</span>
          <span class="stat-value">${formatDistance(route.distanceKm)}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Длительность</span>
          <span class="stat-value">${formatDuration(route.durationMinutes)}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Подходит</span>
          <span class="stat-value chips">${audienceList || "Уточняется"}</span>
        </div>
      </section>
      <section class="section">
        <h2>Описание маршрута</h2>
        <div class="markdown">${descriptionHtml}</div>
      </section>
      <section class="section">
        <h2>Как добраться</h2>
        <p>${route.howToGet ? escapeHtml(route.howToGet) : "Информация уточняется"}</p>
        <h3>Как уехать</h3>
        <p>${route.howToReturn ? escapeHtml(route.howToReturn) : "Информация уточняется"}</p>
        <h3>Риски и предупреждения</h3>
        <p>${route.safetyNotes ? escapeHtml(route.safetyNotes) : "Опасные участки не отмечены"}</p>
      </section>
      <section class="section">
        <h2>Интересные факты</h2>
        ${factsHtml ? `<ul>${factsHtml}</ul>` : '<p>Факты будут добавлены редакцией.</p>'}
      </section>
      <section class="section">
        <h2>Точки интереса</h2>
        ${poiRows
          ? `<table>
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Тип</th>
                  <th>Описание</th>
                  <th>Координаты</th>
                </tr>
              </thead>
              <tbody>${poiRows}</tbody>
            </table>`
          : '<p>Точки интереса появятся после полевого исследования.</p>'}
      </section>
      <footer>
        Сформировано автоматически сервисом «Маршруты Прогулки». Данные OpenStreetMap используются по лицензии ODbL.
      </footer>
    </body>
  </html>`;
}

type PrintParams = {
  slug: string;
};

export async function GET(
  _request: Request,
  { params }: { params: PrintParams | Promise<PrintParams> },
) {
  const { slug } = await params;

  if (!slug) {
    return NextResponse.json({ error: "Не указан маршрут" }, { status: 400 });
  }

  const route = await getRouteDetailsBySlug(slug);

  if (!route) {
    return NextResponse.json({ error: "Маршрут не найден или недоступен" }, { status: 404 });
  }

  const html = buildPdfHtml(route);
  const pdfBuffer = await generatePdf(
    { content: html },
    {
      format: "A4",
      printBackground: true,
      margin: { top: "12mm", right: "12mm", bottom: "16mm", left: "12mm" },
    },
  );

  const pdfBytes = new Uint8Array(pdfBuffer);

  return new NextResponse(pdfBytes, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${route.slug}.pdf"`,
      "Content-Length": String(pdfBytes.byteLength),
    },
  });
}
