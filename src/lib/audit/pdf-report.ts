import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, PDFName, PDFString, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import {
  buildAuditReportModel,
  buildPageIssuesMap,
  categoryLabels,
  categories,
  parseIssueAiRecommendation,
  type AuditReportRecord,
  type GroupedIssue,
  type PageIssueDetail,
} from "@/lib/audit/report-model";
import { buildTechnicalPdfBlocks } from "@/lib/audit/pdf-technical";
import {
  PDF_ACTION_PLAN,
  PDF_BRAND,
  PDF_SLATE,
  PDF_STATS,
  PDF_TECH_ACCENT,
  pdfGradePalette,
  pdfPriorityPalette,
  pdfScoreBarHex,
  pdfSeverityPalette,
} from "@/lib/audit/pdf-colors";
import type { ActionPlan, CategoryRecommendation, ExecutiveSummary, PageSummary } from "@/lib/ai/schemas";
import { parseJsonField } from "@/lib/parse-json";
import { siteConfig } from "@/lib/config";
import { scoreToGrade } from "@/lib/grades";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 44;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const FOOTER_HEIGHT = 36;

const COLORS = {
  brand: PDF_BRAND.primary,
  brandDark: PDF_BRAND.dark,
  brandLight: PDF_BRAND.light,
  brandMuted: PDF_BRAND.muted,
  slate900: PDF_SLATE[900],
  slate700: PDF_SLATE[700],
  slate600: PDF_SLATE[600],
  slate500: PDF_SLATE[500],
  slate400: PDF_SLATE[400],
  slate200: PDF_SLATE[200],
  slate100: PDF_SLATE[100],
  slate50: PDF_SLATE[50],
  white: PDF_SLATE.white,
};

function stripText(text: string): string {
  return text.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function truncate(text: string, max: number): string {
  const clean = stripText(text);
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1)}…`;
}

function severityLabel(severity: string): string {
  return severity.charAt(0).toUpperCase() + severity.slice(1);
}

function formatDate(date: Date | null): string {
  const d = date ? new Date(date) : new Date();
  try {
    return d.toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" });
  } catch {
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }
}

function reportLinkLabel(reportUrl: string): string {
  try {
    const parsed = new URL(reportUrl);
    return `${parsed.host}${parsed.pathname}`;
  } catch {
    return reportUrl;
  }
}

function hexColor(hex: string) {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16) / 255;
  const g = parseInt(value.slice(2, 4), 16) / 255;
  const b = parseInt(value.slice(4, 6), 16) / 255;
  return rgb(r, g, b);
}

function gradePalette(grade: string) {
  return pdfGradePalette(grade);
}

function scoreBarHex(score: number): string {
  return pdfScoreBarHex(score);
}

function severityPalette(severity: string) {
  return pdfSeverityPalette(severity);
}

function roundedRectPath(x: number, y: number, w: number, h: number, r: number): string {
  const rr = Math.min(r, w / 2, h / 2);
  return [
    `M ${x + rr} ${y}`,
    `L ${x + w - rr} ${y}`,
    `Q ${x + w} ${y} ${x + w} ${y + rr}`,
    `L ${x + w} ${y + h - rr}`,
    `Q ${x + w} ${y + h} ${x + w - rr} ${y + h}`,
    `L ${x + rr} ${y + h}`,
    `Q ${x} ${y + h} ${x} ${y + h - rr}`,
    `L ${x} ${y + rr}`,
    `Q ${x} ${y} ${x + rr} ${y}`,
    "Z",
  ].join(" ");
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180;
  const start = { x: cx + r * Math.cos(toRad(startAngle)), y: cy + r * Math.sin(toRad(startAngle)) };
  const end = { x: cx + r * Math.cos(toRad(endAngle)), y: cy + r * Math.sin(toRad(endAngle)) };
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

async function loadLogo(doc: PDFDocument): Promise<PDFImage> {
  const logoPath = path.join(process.cwd(), "public", "logo.png");
  const bytes = await readFile(logoPath);
  return doc.embedPng(bytes);
}

class PdfLayout {
  private y = PAGE_HEIGHT - MARGIN;

  constructor(
    private doc: PDFDocument,
    private page: PDFPage,
    private regular: PDFFont,
    private bold: PDFFont,
    private logo: PDFImage
  ) {}

  static async create() {
    const doc = await PDFDocument.create();
    const regular = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const logo = await loadLogo(doc);
    const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    return new PdfLayout(doc, page, regular, bold, logo);
  }

  private addPage() {
    this.page = this.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.y = PAGE_HEIGHT - MARGIN;
    this.drawPageHeader(false);
  }

  private ensureSpace(needed: number) {
    if (this.y - needed < MARGIN + FOOTER_HEIGHT) this.addPage();
  }

  private wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
    const words = stripText(text).split(" ").filter(Boolean);
    if (words.length === 0) return [""];

    const lines: string[] = [];
    let line = "";

    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(test, size) <= maxWidth) {
        line = test;
      } else {
        if (line) lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  private textWidth(text: string, font: PDFFont, size: number) {
    return font.widthOfTextAtSize(text, size);
  }

  private fillRect(x: number, bottomY: number, w: number, h: number, color: string) {
    this.page.drawRectangle({ x, y: bottomY, width: w, height: h, color: hexColor(color) });
  }

  private strokeRoundedRect(x: number, bottomY: number, w: number, h: number, r: number, color: string, width = 1) {
    this.page.drawSvgPath(roundedRectPath(x, bottomY, w, h, r), {
      borderColor: hexColor(color),
      borderWidth: width,
    });
  }

  private fillRoundedRect(x: number, bottomY: number, w: number, h: number, r: number, color: string) {
    this.page.drawSvgPath(roundedRectPath(x, bottomY, w, h, r), {
      color: hexColor(color),
    });
  }

  private drawTextAt(
    text: string,
    x: number,
    y: number,
    options: { size?: number; font?: PDFFont; color?: string } = {}
  ) {
    const size = options.size ?? 10;
    const font = options.font ?? this.regular;
    this.page.drawText(text, {
      x,
      y,
      size,
      font,
      color: hexColor(options.color ?? COLORS.slate700),
    });
  }

  private addLink(url: string, x: number, bottomY: number, width: number, height: number) {
    const annotation = this.doc.context.register(
      this.doc.context.obj({
        Type: "Annot",
        Subtype: "Link",
        Rect: [x, bottomY, x + width, bottomY + height],
        Border: [0, 0, 0],
        A: {
          Type: "Action",
          S: "URI",
          URI: PDFString.of(url),
        },
      })
    );

    const annotsKey = PDFName.of("Annots");
    const existing = this.page.node.lookup(annotsKey);
    if (existing && "push" in existing && typeof existing.push === "function") {
      existing.push(annotation);
    } else {
      this.page.node.set(annotsKey, this.doc.context.obj([annotation]));
    }
  }

  private drawLinkText(
    text: string,
    url: string,
    x: number,
    y: number,
    options: { size?: number; font?: PDFFont; color?: string } = {}
  ) {
    const size = options.size ?? 10;
    const font = options.font ?? this.regular;
    this.drawTextAt(text, x, y, { size, font, color: options.color ?? COLORS.brand });
    const width = font.widthOfTextAtSize(text, size);
    this.addLink(url, x, y - 2, width, size + 4);
  }

  private drawPill(
    text: string,
    x: number,
    y: number,
    options: { size?: number; bg: string; border: string; textColor: string; font?: PDFFont }
  ) {
    const size = options.size ?? 7;
    const font = options.font ?? this.bold;
    const padX = 8;
    const pillW = font.widthOfTextAtSize(text, size) + padX * 2;
    const pillH = size + 8;
    this.fillRoundedRect(x, y - 2, pillW, pillH, pillH / 2, options.bg);
    this.strokeRoundedRect(x, y - 2, pillW, pillH, pillH / 2, options.border);
    this.drawTextAt(text, x + padX, y + 2, { size, font, color: options.textColor });
    return pillW;
  }

  private drawColoredPanel(
    title: string,
    lines: string[],
    colors: { bg: string; border: string; title: string },
    indent = 0
  ) {
    const titleH = 16;
    const lineH = 11;
    const panelH = titleH + lines.length * lineH + 14;
    this.ensureSpace(panelH + 8);
    const bottomY = this.y - panelH;
    const x = MARGIN + indent;
    const w = CONTENT_WIDTH - indent;

    this.fillRoundedRect(x, bottomY, w, panelH, 8, colors.bg);
    this.strokeRoundedRect(x, bottomY, w, panelH, 8, colors.border);
    this.drawTextAt(title, x + 10, bottomY + panelH - 14, {
      size: 8,
      font: this.bold,
      color: colors.title,
    });

    let cursorY = bottomY + panelH - 28;
    for (const line of lines) {
      const wrapped = this.wrapText(line, this.regular, 8.5, w - 20);
      for (const part of wrapped) {
        this.drawTextAt(part, x + 10, cursorY, { size: 8.5, color: COLORS.slate700 });
        cursorY -= lineH;
      }
    }

    this.y = bottomY - 8;
  }

  private drawLines(
    text: string,
    options: { size?: number; font?: PDFFont; color?: string; lineGap?: number; indent?: number; maxWidth?: number } = {}
  ) {
    const size = options.size ?? 10;
    const font = options.font ?? this.regular;
    const color = options.color ?? COLORS.slate700;
    const lineGap = options.lineGap ?? size + 4;
    const indent = options.indent ?? 0;
    const maxWidth = (options.maxWidth ?? CONTENT_WIDTH) - indent;
    const lines = this.wrapText(text, font, size, maxWidth);

    for (const line of lines) {
      this.ensureSpace(lineGap);
      this.drawTextAt(line, MARGIN + indent, this.y, { size, font, color });
      this.y -= lineGap;
    }
  }

  gap(amount = 8) {
    this.y -= amount;
  }

  label(text: string, size = 10, color = COLORS.slate900) {
    this.drawLines(text, { size, font: this.bold, color, lineGap: size + 4 });
  }

  line(text: string, size = 10, color = COLORS.slate700) {
    this.drawLines(text, { size, color, lineGap: size + 4 });
  }

  newPage() {
    this.addPage();
  }

  private drawPageHeader(full = false) {
    if (full) {
      const barH = 72;
      this.fillRect(0, PAGE_HEIGHT - barH, PAGE_WIDTH, barH, COLORS.white);
      this.fillRect(0, PAGE_HEIGHT - barH, PAGE_WIDTH, 1, COLORS.slate200);
      this.fillRect(0, PAGE_HEIGHT - barH - 1, PAGE_WIDTH, 1, COLORS.slate200);

      const logoH = 42;
      const logoDims = this.logo.scale(logoH / this.logo.height);
      this.page.drawImage(this.logo, {
        x: MARGIN,
        y: PAGE_HEIGHT - barH + (barH - logoH) / 2,
        width: logoDims.width,
        height: logoDims.height,
      });

      const titleX = MARGIN + logoDims.width + 16;
      this.drawTextAt(siteConfig.name, titleX, PAGE_HEIGHT - 30, {
        size: 11,
        font: this.bold,
        color: COLORS.slate900,
      });
      this.drawTextAt(siteConfig.tagline, titleX, PAGE_HEIGHT - 46, {
        size: 8,
        color: COLORS.slate500,
      });
      this.drawTextAt("SEO Audit Report", PAGE_WIDTH - MARGIN - this.textWidth("SEO Audit Report", this.bold, 14), PAGE_HEIGHT - 38, {
        size: 14,
        font: this.bold,
        color: COLORS.brand,
      });

      this.y = PAGE_HEIGHT - barH - 24;
      return;
    }

    const barH = 26;
    this.fillRect(0, PAGE_HEIGHT - barH, PAGE_WIDTH, barH, COLORS.white);
    this.fillRect(0, PAGE_HEIGHT - barH, PAGE_WIDTH, 1, COLORS.slate200);
    const logoH = 14;
    const logoDims = this.logo.scale(logoH / this.logo.height);
    this.page.drawImage(this.logo, {
      x: MARGIN,
      y: PAGE_HEIGHT - barH + (barH - logoH) / 2,
      width: logoDims.width,
      height: logoDims.height,
    });
    this.drawTextAt(siteConfig.name, MARGIN + logoDims.width + 8, PAGE_HEIGHT - 17, {
      size: 8,
      font: this.bold,
      color: COLORS.slate700,
    });
    this.y = PAGE_HEIGHT - barH - 14;
  }

  renderCoverHeader(model: { url: string; domain: string; completedAt: Date | null }) {
    const barH = 88;
    this.fillRect(0, PAGE_HEIGHT - barH, PAGE_WIDTH, barH, COLORS.white);
    this.fillRect(0, PAGE_HEIGHT - barH - 1, PAGE_WIDTH, 1, COLORS.slate200);

    const logoH = 48;
    const logoDims = this.logo.scale(logoH / this.logo.height);
    this.page.drawImage(this.logo, {
      x: MARGIN,
      y: PAGE_HEIGHT - barH + (barH - logoH) / 2,
      width: logoDims.width,
      height: logoDims.height,
    });

    const metaX = MARGIN + logoDims.width + 18;
    this.drawTextAt(siteConfig.name, metaX, PAGE_HEIGHT - 28, { size: 12, font: this.bold, color: COLORS.slate900 });
    this.drawTextAt(siteConfig.tagline.toUpperCase(), metaX, PAGE_HEIGHT - 44, { size: 7.5, color: COLORS.slate500 });
    this.drawTextAt("SEO Audit Report", metaX, PAGE_HEIGHT - 60, { size: 9, font: this.bold, color: COLORS.brand });

    const reportLabel = "Generated report";
    this.drawTextAt(
      reportLabel,
      PAGE_WIDTH - MARGIN - this.textWidth(reportLabel, this.regular, 8),
      PAGE_HEIGHT - 28,
      { size: 8, color: COLORS.slate500 }
    );
    this.drawTextAt(
      formatDate(model.completedAt),
      PAGE_WIDTH - MARGIN - this.textWidth(formatDate(model.completedAt), this.regular, 9),
      PAGE_HEIGHT - 44,
      { size: 9, color: COLORS.slate700 }
    );

    this.y = PAGE_HEIGHT - barH - 20;

    const urlBarH = 34;
    const urlBottom = this.y - urlBarH;
    this.fillRoundedRect(MARGIN, urlBottom, CONTENT_WIDTH, urlBarH, 8, COLORS.slate50);
    this.strokeRoundedRect(MARGIN, urlBottom, CONTENT_WIDTH, urlBarH, 8, COLORS.slate200);
    this.drawTextAt(truncate(model.url, 72), MARGIN + 12, urlBottom + 12, {
      size: 11,
      font: this.bold,
      color: COLORS.slate900,
    });
    this.drawTextAt(model.domain, MARGIN + 12, urlBottom + urlBarH - 22, {
      size: 8,
      color: COLORS.slate500,
    });
    this.y = urlBottom - 18;
  }

  renderOnlineReportLink(reportUrl: string) {
    const label = reportLinkLabel(reportUrl);
    const boxH = 40;
    this.ensureSpace(boxH + 8);
    const bottomY = this.y - boxH;

    this.fillRoundedRect(MARGIN, bottomY, CONTENT_WIDTH, boxH, 8, COLORS.brandLight);
    this.strokeRoundedRect(MARGIN, bottomY, CONTENT_WIDTH, boxH, 8, COLORS.brandMuted);

    this.drawTextAt("View full interactive report online", MARGIN + 12, bottomY + boxH - 14, {
      size: 8,
      font: this.bold,
      color: COLORS.brandDark,
    });

    this.drawLinkText(label, reportUrl, MARGIN + 12, bottomY + 12, {
      size: 9.5,
      font: this.bold,
      color: COLORS.brand,
    });

    this.y = bottomY - 12;
  }

  renderScoreHero(
    overallScore: number,
    overallGrade: string,
    verdict: { title: string; description: string },
    totalUnique: number,
    url: string
  ) {
    const palette = gradePalette(overallGrade);
    const ringColor = scoreBarHex(overallScore);
    const heroH = 132;
    this.ensureSpace(heroH + 8);
    const bottomY = this.y - heroH;

    this.fillRoundedRect(MARGIN, bottomY, CONTENT_WIDTH, heroH, 12, COLORS.white);
    this.strokeRoundedRect(MARGIN, bottomY, CONTENT_WIDTH, heroH, 12, COLORS.slate200, 1.5);

    const ringR = 36;
    const blockW = ringR * 2 + 8;
    const blockX = MARGIN + 18;
    const blockTop = bottomY + heroH - 18;
    this.drawTextAt("SCORE", blockX + (blockW - this.textWidth("SCORE", this.bold, 7)) / 2, blockTop, {
      size: 7,
      font: this.bold,
      color: COLORS.slate500,
    });
    const bigScore = String(overallScore);
    const bigSize = 40;
    this.drawTextAt(
      bigScore,
      blockX + (blockW - this.textWidth(bigScore, this.bold, bigSize)) / 2,
      blockTop - bigSize - 4,
      { size: bigSize, font: this.bold, color: ringColor }
    );
    this.drawTextAt(
      "/100",
      blockX + (blockW - this.textWidth("/100", this.regular, 9)) / 2,
      blockTop - bigSize - 18,
      { size: 9, color: COLORS.slate500 }
    );

    const badgeSize = 52;
    const badgeX = blockX + blockW + 14;
    const badgeBottom = bottomY + (heroH - badgeSize) / 2;
    this.fillRoundedRect(badgeX, badgeBottom, badgeSize, badgeSize, 10, palette.bg);
    this.strokeRoundedRect(badgeX, badgeBottom, badgeSize, badgeSize, 10, palette.border, 1.5);
    this.drawTextAt(
      overallGrade,
      badgeX + (badgeSize - this.textWidth(overallGrade, this.bold, 20)) / 2,
      badgeBottom + 18,
      { size: 20, font: this.bold, color: palette.text }
    );

    const uniqueBoxW = 96;
    const uniqueBoxH = 56;
    const uniqueX = PAGE_WIDTH - MARGIN - uniqueBoxW - 12;
    const uniqueBottom = bottomY + (heroH - uniqueBoxH) / 2;
    this.fillRoundedRect(uniqueX, uniqueBottom, uniqueBoxW, uniqueBoxH, 8, COLORS.slate50);
    this.strokeRoundedRect(uniqueX, uniqueBottom, uniqueBoxW, uniqueBoxH, 8, COLORS.slate200);
    const uniqueText = String(totalUnique);
    this.drawTextAt(
      uniqueText,
      uniqueX + (uniqueBoxW - this.textWidth(uniqueText, this.bold, 22)) / 2,
      uniqueBottom + 30,
      { size: 22, font: this.bold, color: COLORS.slate900 }
    );
    this.drawTextAt(
      "Unique",
      uniqueX + (uniqueBoxW - this.textWidth("Unique", this.regular, 7)) / 2,
      uniqueBottom + 16,
      { size: 7, color: COLORS.slate500 }
    );
    this.drawTextAt(
      "Recommendations",
      uniqueX + (uniqueBoxW - this.textWidth("Recommendations", this.regular, 7)) / 2,
      uniqueBottom + 8,
      { size: 7, color: COLORS.slate500 }
    );

    const textX = badgeX + badgeSize + 16;
    const textMax = uniqueX - textX - 12;
    const gradeLine = `${overallScore}/100 · GRADE ${overallGrade}`;
    this.drawTextAt(gradeLine, textX, bottomY + heroH - 28, {
      size: 8,
      font: this.bold,
      color: palette.text,
    });

    const titleLines = this.wrapText(verdict.title, this.bold, 12, textMax);
    let titleY = bottomY + heroH - 44;
    for (const line of titleLines.slice(0, 2)) {
      this.drawTextAt(line, textX, titleY, { size: 12, font: this.bold, color: COLORS.slate900 });
      titleY -= 14;
    }

    this.drawTextAt(truncate(url, 56), textX, bottomY + heroH - 72, {
      size: 8,
      color: COLORS.slate500,
    });

    const descLines = this.wrapText(verdict.description, this.regular, 8.5, textMax);
    let descY = bottomY + heroH - 86;
    for (const line of descLines.slice(0, 2)) {
      this.drawTextAt(line, textX, descY, { size: 8.5, color: COLORS.slate600 });
      descY -= 11;
    }

    this.y = bottomY - 16;
  }

  renderStatCards(stats: {
    critical: number;
    warning: number;
    notice: number;
    pagesCrawled: number;
  }) {
    const cardH = 54;
    const gap = 10;
    const cardW = (CONTENT_WIDTH - gap * 3) / 4;
    this.ensureSpace(cardH + 12);
    const bottomY = this.y - cardH;

    const cards = [
      { label: "Critical", value: stats.critical, ...PDF_STATS.critical },
      { label: "Warnings", value: stats.warning, ...PDF_STATS.warning },
      { label: "Notices", value: stats.notice, ...PDF_STATS.notice },
      { label: "Pages Crawled", value: stats.pagesCrawled, ...PDF_STATS.pages },
    ];

    cards.forEach((card, i) => {
      const x = MARGIN + i * (cardW + gap);
      this.fillRoundedRect(x, bottomY, cardW, cardH, 8, card.bg);
      this.strokeRoundedRect(x, bottomY, cardW, cardH, 8, card.border);
      const valueText = String(card.value);
      this.drawTextAt(valueText, x + 12, bottomY + 28, {
        size: 18,
        font: this.bold,
        color: card.text,
      });
      this.drawTextAt(card.label, x + 12, bottomY + 12, {
        size: 7,
        color: COLORS.slate500,
      });
    });

    this.y = bottomY - 20;
  }

  sectionTitle(title: string) {
    this.gap(10);
    this.ensureSpace(28);
    this.drawTextAt(title, MARGIN, this.y, { size: 13, font: this.bold, color: COLORS.brand });
    this.y -= 6;
    this.fillRect(MARGIN, this.y - 2, 48, 3, COLORS.brand);
    this.y -= 14;
  }

  renderCategoryScores(scores: Record<string, number>) {
    this.sectionTitle("Category Scores");

    const cols = categories.length;
    const gap = 8;
    const cardW = (CONTENT_WIDTH - gap * (cols - 1)) / cols;
    const cardH = 72;
    this.ensureSpace(cardH + 12);
    const bottomY = this.y - cardH;

    categories.forEach((cat, index) => {
      const x = MARGIN + index * (cardW + gap);
      const score = scores[cat] ?? 0;
      const grade = scoreToGrade(score);
      const palette = gradePalette(grade);
      const barColor = scoreBarHex(score);

      this.fillRoundedRect(x, bottomY, cardW, cardH, 8, COLORS.white);
      this.strokeRoundedRect(x, bottomY, cardW, cardH, 8, COLORS.slate200);

      const label = categoryLabels[cat];
      this.drawTextAt(label, x + (cardW - this.textWidth(label, this.bold, 6.5)) / 2, bottomY + cardH - 10, {
        size: 6.5,
        font: this.bold,
        color: COLORS.slate500,
      });
      this.drawTextAt(grade, x + (cardW - this.textWidth(grade, this.bold, 18)) / 2, bottomY + 36, {
        size: 18,
        font: this.bold,
        color: palette.text,
      });
      const scoreLabel = `${score}/100`;
      this.drawTextAt(scoreLabel, x + (cardW - this.textWidth(scoreLabel, this.regular, 8)) / 2, bottomY + 24, {
        size: 8,
        color: palette.text,
      });

      const barX = x + 8;
      const barY = bottomY + 10;
      const barW = cardW - 16;
      this.fillRoundedRect(barX, barY, barW, 4, 2, COLORS.slate100);
      this.fillRoundedRect(barX, barY, Math.max(3, (score / 100) * barW), 4, 2, barColor);
    });

    this.y = bottomY - 20;
  }

  renderExecutiveSummary(summary: ExecutiveSummary) {
    this.sectionTitle("AI SEO Expert Summary");

    this.drawLines(summary.headline, { size: 12, font: this.bold, color: COLORS.slate900, lineGap: 16 });
    this.paragraph(summary.summary);
    this.paragraph(summary.overallAssessment, { size: 9, color: COLORS.slate500 });

    if (summary.topStrengths.length > 0) {
      this.drawColoredPanel(
        "TOP STRENGTHS",
        summary.topStrengths.map((s) => `• ${s}`),
        { bg: "#fef2f2", border: "#fecaca", title: "#7b1414" }
      );
    }

    if (summary.topWeaknesses.length > 0) {
      this.drawColoredPanel(
        "TOP WEAKNESSES",
        summary.topWeaknesses.map((w) => `• ${w}`),
        { bg: "#fffbeb", border: "#fde68d", title: "#b45309" }
      );
    }

    if (summary.businessImpact) {
      this.drawColoredPanel(
        "Business Impact",
        [summary.businessImpact],
        { bg: COLORS.brandLight, border: COLORS.brandMuted, title: COLORS.brandDark }
      );
    }

    if (summary.nextBestActions.length > 0) {
      this.label("Next Best Actions", 9, COLORS.slate900);
      summary.nextBestActions.forEach((action, i) => {
        this.drawLines(`${i + 1}. ${action}`, { size: 9, indent: 4 });
      });
      this.gap(6);
    }
  }

  paragraph(text: string, options?: { size?: number; color?: string }) {
    this.drawLines(text, {
      size: options?.size ?? 10,
      color: options?.color ?? COLORS.slate700,
    });
    this.gap(4);
  }

  bullets(items: string[]) {
    for (const item of items) {
      this.drawLines(`• ${item}`, { size: 9, indent: 8 });
    }
    this.gap(4);
  }

  renderActionPlan(plan: ActionPlan) {
    this.sectionTitle("AI Priority Action Plan");

    const sections = [
      { key: "quickWins" as const, title: "Quick Wins", items: plan.quickWins },
      { key: "technicalFixes" as const, title: "Technical Fixes", items: plan.technicalFixes },
      { key: "contentImprovements" as const, title: "Content Improvements", items: plan.contentImprovements },
      { key: "strategicImprovements" as const, title: "Strategic Improvements", items: plan.strategicImprovements },
      { key: "sevenDayPlan" as const, title: "7-Day Plan", items: plan.sevenDayPlan },
      { key: "thirtyDayPlan" as const, title: "30-Day Plan", items: plan.thirtyDayPlan },
    ].filter((s) => s.items.length > 0);

    const cols = 2;
    const gap = 10;
    const cardW = (CONTENT_WIDTH - gap) / cols;
    let rowBottom = this.y;

    sections.forEach((section, index) => {
      const colors = PDF_ACTION_PLAN[section.key];
      const col = index % cols;
      const items = section.items.map((item) => `• ${item}`);
      const estH = 24 + items.reduce(
        (sum, item) => sum + this.wrapText(item, this.regular, 8.5, cardW - 20).length * 12,
        0
      );
      this.ensureSpace(estH + 8);
      const bottomY = (col === 0 ? this.y : rowBottom) - estH;
      const x = MARGIN + col * (cardW + gap);

      this.fillRoundedRect(x, bottomY, cardW, estH, 8, colors.bg);
      this.strokeRoundedRect(x, bottomY, cardW, estH, 8, colors.border);
      this.drawTextAt(section.title, x + 10, bottomY + estH - 14, {
        size: 9,
        font: this.bold,
        color: colors.title,
      });

      let itemY = bottomY + estH - 28;
      for (const item of items) {
        for (const line of this.wrapText(item, this.regular, 8.5, cardW - 20)) {
          this.drawTextAt(line, x + 10, itemY, { size: 8.5, color: COLORS.slate700 });
          itemY -= 12;
        }
      }

      if (col === 0) rowBottom = bottomY;
      if (col === cols - 1 || index === sections.length - 1) this.y = bottomY - 10;
    });
  }

  renderTechnicalInsights(performanceData: string | null, schemaSummary: string | null) {
    const blocks = buildTechnicalPdfBlocks(performanceData, schemaSummary);
    if (blocks.length === 0) return;

    this.sectionTitle("Technical Intelligence");
    this.drawLines(
      "Powered by Google CrUX, Lighthouse, Open PageRank, MDN HTTP Observatory, Safe Browsing, DNS, and W3C.",
      { size: 8, color: COLORS.slate500 }
    );
    this.gap(6);

    for (const block of blocks) {
      const accent = PDF_TECH_ACCENT[block.accent];
      const lineCount = block.lines.reduce(
        (sum, line) => sum + this.wrapText(line, this.regular, 8.5, CONTENT_WIDTH - 24).length,
        0
      );
      const boxH = 28 + lineCount * 12;
      this.ensureSpace(boxH + 8);
      const bottomY = this.y - boxH;

      this.fillRoundedRect(MARGIN, bottomY, CONTENT_WIDTH, boxH, 8, accent.bg);
      this.strokeRoundedRect(MARGIN, bottomY, CONTENT_WIDTH, boxH, 8, accent.border);
      this.fillRect(MARGIN, bottomY, 4, boxH, accent.header);
      this.drawTextAt(block.title, MARGIN + 12, bottomY + boxH - 14, {
        size: 9,
        font: this.bold,
        color: accent.header,
      });

      let cursorY = bottomY + boxH - 28;
      for (const line of block.lines) {
        for (const part of this.wrapText(line, this.regular, 8.5, CONTENT_WIDTH - 24)) {
          this.drawTextAt(part, MARGIN + 12, cursorY, { size: 8.5, color: COLORS.slate700 });
          cursorY -= 12;
        }
      }

      this.y = bottomY - 8;
    }
  }

  renderCategoryInsight(insight: CategoryRecommendation, cat: keyof typeof categoryLabels) {
    this.drawColoredPanel(
      `AI Insights — ${categoryLabels[cat]}`,
      [
        insight.summary,
        `Score: ${insight.score}/100 · Priority: ${insight.priority}`,
        ...insight.recommendations.flatMap((rec) => [
          `${rec.title} (impact: ${rec.impact}, effort: ${rec.effort})`,
          rec.description,
        ]),
      ],
      { bg: "#f8fafc", border: "#e2e8f0", title: "#6d28d9" }
    );
  }

  renderCategoryTabs(groupedIssues: GroupedIssue[]) {
    this.gap(4);
    let x = MARGIN;
    const total = groupedIssues.length;
    const pills = [
      { label: `All (${total})`, bg: COLORS.brand, text: COLORS.white, border: COLORS.brand },
      ...categories.map((cat) => ({
        label: `${categoryLabels[cat]} (${groupedIssues.filter((g) => g.category === cat).length})`,
        bg: COLORS.white,
        text: COLORS.slate600,
        border: COLORS.slate200,
      })),
    ];

    this.ensureSpace(24);
    const pillY = this.y;
    for (const pill of pills) {
      const w =
        this.drawPill(pill.label, x, pillY, {
          size: 7,
          bg: pill.bg,
          border: pill.border,
          textColor: pill.text,
        }) + 6;
      x += w;
      if (x > PAGE_WIDTH - MARGIN - 80) {
        x = MARGIN;
        this.y -= 18;
      }
    }
    this.y -= 22;
  }

  renderIssuesByCategory(
    groupedIssues: GroupedIssue[],
    categoryInsights: Record<string, CategoryRecommendation>
  ) {
    this.sectionTitle("Issues & Recommendations");
    this.renderCategoryTabs(groupedIssues);

    let index = 0;
    for (const cat of categories) {
      const catIssues = groupedIssues.filter((g) => g.category === cat);
      if (catIssues.length === 0) continue;

      this.gap(6);
      this.drawTextAt(`${categoryLabels[cat]} (${catIssues.length})`, MARGIN, this.y, {
        size: 11,
        font: this.bold,
        color: COLORS.brand,
      });
      this.y -= 18;

      const insight = categoryInsights[cat];
      if (insight) this.renderCategoryInsight(insight, cat);

      for (const issue of catIssues) {
        this.renderIssue(issue, index);
        index += 1;
      }
    }
  }

  renderIssue(issue: GroupedIssue, index: number) {
    const palette = severityPalette(issue.severity);
    const aiRec = parseIssueAiRecommendation(issue.aiRecommendation);
    const contentWidth = CONTENT_WIDTH - 36;

    const descLines = this.wrapText(issue.description, this.regular, 8.5, contentWidth);
    const recLines = issue.recommendation
      ? this.wrapText(issue.recommendation, this.regular, 8.5, contentWidth)
      : [];
    const titleLines = this.wrapText(`${index + 1}. ${issue.title}`, this.bold, 9.5, contentWidth - 60);
    const urlLines = issue.affectedUrls.flatMap((url) =>
      this.wrapText(`• ${url}`, this.regular, 7.5, contentWidth - 8)
    );

    const aiBlocks: Array<{ label: string; lines: string[] }> = [];
    if (aiRec) {
      aiBlocks.push({ label: aiRec.title, lines: this.wrapText(aiRec.summary, this.regular, 8.5, contentWidth) });
      aiBlocks.push({
        label: "Why it matters",
        lines: this.wrapText(aiRec.whyItMatters, this.regular, 8.5, contentWidth),
      });
      aiBlocks.push({
        label: "How to fix",
        lines: this.wrapText(aiRec.howToFix, this.regular, 8.5, contentWidth),
      });
      if (aiRec.developerNotes) {
        aiBlocks.push({
          label: "Developer notes",
          lines: this.wrapText(aiRec.developerNotes, this.regular, 8, contentWidth),
        });
      }
      if (aiRec.exampleFix) {
        aiBlocks.push({
          label: "Example fix",
          lines: this.wrapText(aiRec.exampleFix, this.regular, 7.5, contentWidth),
        });
      }
    }

    const estH =
      56 +
      titleLines.length * 12 +
      descLines.length * 11 +
      recLines.length * 11 +
      (recLines.length ? 14 : 0) +
      (urlLines.length ? 14 + urlLines.length * 10 : 0) +
      aiBlocks.reduce((sum, block) => sum + 14 + block.lines.length * 11, 0) +
      (aiRec ? 14 : 0);

    this.ensureSpace(estH + 8);
    const bottomY = this.y - estH;

    this.fillRoundedRect(MARGIN, bottomY, CONTENT_WIDTH, estH, 8, COLORS.white);
    this.strokeRoundedRect(MARGIN, bottomY, CONTENT_WIDTH, estH, 8, COLORS.slate200);
    this.fillRect(MARGIN, bottomY, 4, estH, palette.accent);

    let titleY = bottomY + estH - 18;
    for (const line of titleLines) {
      this.drawTextAt(line, MARGIN + 12, titleY, {
        size: 9.5,
        font: this.bold,
        color: COLORS.slate900,
      });
      titleY -= 12;
    }

    let pillX = MARGIN + 12;
    const sevW = this.drawPill(severityLabel(issue.severity), pillX, bottomY + estH - 34, {
      size: 7,
      bg: palette.bg,
      border: palette.border,
      textColor: palette.text,
      font: this.bold,
    });
    pillX += sevW + 6;
    this.drawPill(categoryLabels[issue.category], pillX, bottomY + estH - 34, {
      size: 7,
      bg: COLORS.slate50,
      border: COLORS.slate200,
      textColor: COLORS.slate600,
    });
    if (issue.affectedUrls.length > 1) {
      pillX += this.textWidth(categoryLabels[issue.category], this.bold, 7) + 24;
      this.drawPill(`${issue.affectedUrls.length} pages`, pillX, bottomY + estH - 34, {
        size: 7,
        bg: COLORS.white,
        border: COLORS.slate200,
        textColor: COLORS.slate600,
      });
    }

    let cursorY = bottomY + estH - 50;
    for (const line of descLines) {
      this.drawTextAt(line, MARGIN + 12, cursorY, { size: 8.5, color: COLORS.slate700 });
      cursorY -= 11;
    }

    if (recLines.length > 0) {
      cursorY -= 2;
      this.drawTextAt("Fix:", MARGIN + 12, cursorY, { size: 7.5, font: this.bold, color: COLORS.slate900 });
      cursorY -= 11;
      for (const line of recLines) {
        this.drawTextAt(line, MARGIN + 12, cursorY, { size: 8.5, color: COLORS.brandDark });
        cursorY -= 11;
      }
    }

    if (urlLines.length > 0) {
      cursorY -= 2;
      this.drawTextAt(`Affected URLs (${issue.affectedUrls.length})`, MARGIN + 12, cursorY, {
        size: 7.5,
        font: this.bold,
        color: COLORS.slate500,
      });
      cursorY -= 11;
      for (const line of urlLines) {
        this.drawTextAt(line, MARGIN + 16, cursorY, { size: 7.5, color: COLORS.slate600 });
        cursorY -= 10;
      }
    }

    if (aiRec) {
      cursorY -= 2;
      this.drawTextAt("AI fix guidance", MARGIN + 12, cursorY, { size: 7.5, font: this.bold, color: COLORS.brand });
      cursorY -= 11;
      for (const block of aiBlocks) {
        this.drawTextAt(block.label, MARGIN + 12, cursorY, { size: 8, font: this.bold, color: COLORS.slate900 });
        cursorY -= 11;
        for (const line of block.lines) {
          this.drawTextAt(line, MARGIN + 14, cursorY, { size: 8.5, color: COLORS.slate700 });
          cursorY -= 11;
        }
      }
      this.drawTextAt(
        `Priority: ${aiRec.priority} · Impact: ${aiRec.impact} · Effort: ${aiRec.effort}`,
        MARGIN + 12,
        cursorY,
        { size: 7.5, color: COLORS.slate500 }
      );
    }

    this.y = bottomY - 8;
  }

  renderPageBreakdown(
    pages: Array<{
      id: string;
      url: string;
      title: string | null;
      statusCode: number;
      wordCount: number;
      issueCount: number;
      aiPageSummary: string | null;
    }>,
    pageIssues: Map<string, PageIssueDetail[]>
  ) {
    this.newPage();
    this.sectionTitle("Page Breakdown");

    const headerH = 22;
    this.ensureSpace(headerH);
    const headerBottom = this.y - headerH;
    this.fillRoundedRect(MARGIN, headerBottom, CONTENT_WIDTH, headerH, 6, COLORS.brand);
    this.drawTextAt("URL", MARGIN + 8, headerBottom + 7, { size: 8, font: this.bold, color: COLORS.white });
    this.drawTextAt("Status", MARGIN + 280, headerBottom + 7, { size: 8, font: this.bold, color: COLORS.white });
    this.drawTextAt("Words", MARGIN + 340, headerBottom + 7, { size: 8, font: this.bold, color: COLORS.white });
    this.drawTextAt("Issues", MARGIN + 400, headerBottom + 7, { size: 8, font: this.bold, color: COLORS.white });
    this.y = headerBottom - 4;

    pages.forEach((page) => {
      const issues = pageIssues.get(page.id) ?? [];
      const summary = parseJsonField<PageSummary | null>(page.aiPageSummary, null);
      const displayTitle = page.title ?? page.url;

      const rowH = 28;
      this.ensureSpace(rowH);
      const rowBottom = this.y - rowH;
      this.fillRoundedRect(MARGIN, rowBottom, CONTENT_WIDTH, rowH, 6, COLORS.slate50);
      this.strokeRoundedRect(MARGIN, rowBottom, CONTENT_WIDTH, rowH, 6, COLORS.slate200);

      this.drawTextAt(truncate(displayTitle, 58), MARGIN + 8, rowBottom + 16, {
        size: 7.5,
        font: this.bold,
        color: COLORS.slate900,
      });
      this.drawTextAt(truncate(page.url, 58), MARGIN + 8, rowBottom + 6, { size: 6.5, color: COLORS.slate500 });
      this.drawTextAt(String(page.statusCode), MARGIN + 280, rowBottom + 11, { size: 8, color: COLORS.slate700 });
      this.drawTextAt(String(page.wordCount), MARGIN + 340, rowBottom + 11, { size: 8, color: COLORS.slate700 });

      const issueColor = page.issueCount > 5 ? "#be123c" : page.issueCount > 0 ? "#b45309" : "#7b1414";
      this.drawTextAt(String(page.issueCount), MARGIN + 400, rowBottom + 11, {
        size: 8,
        font: this.bold,
        color: issueColor,
      });
      this.y = rowBottom - 6;

      if (issues.length > 0) {
        this.label("Issues on this page", 8, COLORS.slate500);
        for (const issue of issues) {
          const palette = severityPalette(issue.severity);
          this.drawPill(severityLabel(issue.severity), MARGIN + 4, this.y, {
            size: 7,
            bg: palette.bg,
            border: palette.border,
            textColor: palette.text,
            font: this.bold,
          });
          this.y -= 16;
          this.drawLines(issue.title, { size: 8.5, font: this.bold, color: COLORS.slate900, indent: 4 });
          this.drawLines(issue.description, { size: 8, indent: 8, color: COLORS.slate700 });
          if (issue.recommendation) {
            this.drawLines(`Fix: ${issue.recommendation}`, { size: 8, indent: 8, color: COLORS.brandDark });
          }
          this.gap(4);
        }
      }

      if (summary) {
        this.drawColoredPanel(
          "AI page summary",
          [
            summary.summary,
            `Priority: ${summary.priority}`,
            ...summary.mainProblems.map((p) => `Problem: ${p}`),
            ...summary.recommendedFixes.map((f) => `Fix: ${f}`),
          ],
          { bg: COLORS.brandLight, border: COLORS.brandMuted, title: COLORS.brandDark }
        );
      }

      this.gap(10);
    });
  }

  linkLine(text: string, url: string, size = 9) {
    this.ensureSpace(size + 8);
    this.drawLinkText(text, url, MARGIN, this.y, { size, font: this.bold, color: COLORS.brand });
    this.y -= size + 8;
  }

  async finish(footerPrefix: string, reportUrl: string): Promise<Buffer> {
    const total = this.doc.getPageCount();
    const pages = this.doc.getPages();
    const logoH = 14;
    const logoDims = this.logo.scale(logoH / this.logo.height);
    const linkLabel = reportLinkLabel(reportUrl);
    const linkPrefix = "Full report: ";
    const linkSize = 6.5;
    const prefixWidth = this.textWidth(`${footerPrefix} · ${linkPrefix}`, this.regular, linkSize);
    const linkWidth = this.regular.widthOfTextAtSize(linkLabel, linkSize);

    pages.forEach((page, index) => {
      this.page = page;
      this.fillRect(0, 0, PAGE_WIDTH, FOOTER_HEIGHT, COLORS.slate50);
      this.fillRect(0, FOOTER_HEIGHT - 1, PAGE_WIDTH, 1, COLORS.slate200);

      page.drawImage(this.logo, {
        x: MARGIN,
        y: 10,
        width: logoDims.width,
        height: logoDims.height,
      });

      const footerX = MARGIN + logoDims.width + 8;
      page.drawText(`${footerPrefix} · ${linkPrefix}`, {
        x: footerX,
        y: 14,
        size: linkSize,
        font: this.regular,
        color: hexColor(COLORS.slate400),
      });
      page.drawText(linkLabel, {
        x: footerX + prefixWidth,
        y: 14,
        size: linkSize,
        font: this.regular,
        color: hexColor(COLORS.brand),
      });
      this.addLink(reportUrl, footerX + prefixWidth, 12, linkWidth, linkSize + 4);

      const pageLabel = `Page ${index + 1} of ${total}`;
      page.drawText(pageLabel, {
        x: PAGE_WIDTH - MARGIN - this.textWidth(pageLabel, this.regular, 7),
        y: 14,
        size: 7,
        font: this.regular,
        color: hexColor(COLORS.slate400),
      });
    });

    const bytes = await this.doc.save();
    return Buffer.from(bytes);
  }
}

export async function generateAuditPdf(audit: AuditReportRecord): Promise<Buffer> {
  const model = buildAuditReportModel(audit);
  const pageIssues = buildPageIssuesMap(audit.pages, audit.issues);
  const pdf = await PdfLayout.create();

  pdf.renderCoverHeader(model);
  pdf.renderOnlineReportLink(model.reportUrl);
  pdf.renderScoreHero(
    model.overallScore,
    model.overallGrade,
    model.verdict,
    model.stats.totalUnique,
    model.url
  );
  pdf.renderStatCards({
    critical: model.stats.critical,
    warning: model.stats.warning,
    notice: model.stats.notice,
    pagesCrawled: model.stats.pagesCrawled,
  });
  pdf.renderCategoryScores(model.categoryScores);
  pdf.renderTechnicalInsights(audit.performanceData, audit.schemaSummary ?? null);

  if (model.executiveSummary) pdf.renderExecutiveSummary(model.executiveSummary);
  if (model.actionPlan) pdf.renderActionPlan(model.actionPlan);

  pdf.renderIssuesByCategory(model.groupedIssues, model.categoryInsights);
  pdf.renderPageBreakdown(model.pages, pageIssues);

  const footerPrefix = `${siteConfig.name} · Powered by ${siteConfig.company.name}`;
  return pdf.finish(footerPrefix, model.reportUrl);
}

export function auditPdfFilename(domain: string): string {
  const safe = domain.replace(/[^a-z0-9.-]/gi, "-").toLowerCase();
  const date = new Date().toISOString().slice(0, 10);
  const time = new Date().toISOString().slice(11, 19).replace(/:/g, "");
  return `seo-audit-${safe}-${date}-${time}.pdf`;
}
