import PDFDocument from "pdfkit";

function safeText(value, fallback = "") {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map((v) => safeText(v)).filter(Boolean).join(", ");
  if (typeof value === "object") {
    if (value.value !== undefined) return safeText(value.value, fallback);
    try { return JSON.stringify(value); } catch { return fallback; }
  }
  return fallback;
}

import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel
} from "docx";

export function buildPdf(
  inspection,
  res
) {
  const doc =
    new PDFDocument({
      margin: 45
    });

  res.setHeader(
    "Content-Type",
    "application/pdf"
  );

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${inspection.inspectionId}.pdf"`
  );

  doc.pipe(res);

  doc
    .fontSize(20)
    .text(
      "LegalMetriX AI - Compliance Inspection Report"
    );

  doc.moveDown();

  doc
    .fontSize(10)
    .text(
      `Inspection ID: ${inspection.inspectionId}`
    );

  doc.text(
    `Created: ${new Date(
      inspection.createdAt
    ).toLocaleString("en-IN")}`
  );

  doc.text(
    `Rule baseline: ${inspection.ruleVersion}`
  );

  doc.moveDown();

  const report =
    inspection.complianceReport || {};

  doc
    .fontSize(15)
    .text(
      `Overall Status: ${
        report.status ||
        "needs_review"
      }`
    );

  doc
    .fontSize(11)
    .text(
      `Compliance Score: ${
        report.score ?? "N/A"
      }%`
    );

  doc.moveDown();

  doc
    .fontSize(14)
    .text(
      "Declaration Checks"
    );

  doc.moveDown();

  for (
    const item of
    inspection.declarations || []
  ) {
    doc
      .fontSize(10)
      .text(
        `${safeText(item.label || item.key, "Declaration")}: ${safeText(item.status, "needs_review")}`
      );

    if (item.value) {
      doc
        .fontSize(9)
        .text(
          `Detected: ${safeText(item.value)}`
        );
    }

    if (item.reason) {
      doc
        .fontSize(9)
        .text(
          `Reason: ${safeText(item.reason)}`
        );
    }

    doc.moveDown(0.5);
  }

  doc.moveDown();

  doc
    .fontSize(14)
    .text(
      "OCR Evidence"
    );

  doc
    .fontSize(9)
    .text(
      (
        inspection.extractedText ||
        ""
      ).slice(0, 7000)
    );

  doc.end();
}

export async function buildDocx(
  inspection
) {
  const children = [
    new Paragraph({
      text:
        "LegalMetriX AI - Compliance Inspection Report",
      heading:
        HeadingLevel.TITLE
    }),

    new Paragraph(
      `Inspection ID: ${inspection.inspectionId}`
    ),

    new Paragraph(
      `Rule baseline: ${inspection.ruleVersion}`
    ),

    new Paragraph(
      `Overall status: ${
        inspection
          .complianceReport
          ?.status ||
        "needs_review"
      }`
    ),

    new Paragraph(
      `Compliance score: ${
        inspection
          .complianceReport
          ?.score ??
        "N/A"
      }%`
    ),

    new Paragraph({
      text:
        "Declaration Checks",
      heading:
        HeadingLevel.HEADING_1
    })
  ];

  for (
    const item of
    inspection.declarations || []
  ) {
    children.push(
      new Paragraph(
        `${safeText(item.label || item.key, "Declaration")}: ${safeText(item.status, "needs_review")}`
      )
    );

    children.push(
      new Paragraph(
        `Detected: ${safeText(item.value, "Not detected")}`
      )
    );

    children.push(
      new Paragraph(
        `Reason: ${safeText(item.reason)}`
      )
    );
  }

  children.push(
    new Paragraph({
      text: "OCR Evidence",
      heading:
        HeadingLevel.HEADING_1
    })
  );

  children.push(
    new Paragraph(
      (
        inspection.extractedText ||
        ""
      ).slice(0, 12000)
    )
  );

  const doc =
    new Document({
      sections: [
        {
          children
        }
      ]
    });

  return Packer.toBuffer(doc);
}