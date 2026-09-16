import sharp from "sharp";
import { createWorker } from "tesseract.js";
import fs from "fs";
import path from "path";

const makeProcessedImage = async (
  imagePath,
  suffix,
  mode = "normal",
  crop = null
) => {
  const extension = path.extname(imagePath);

  const processedImage = imagePath.replace(
    new RegExp(`${extension}$`, "i"),
    `-${suffix}.png`
  );

  let pipeline = sharp(imagePath).rotate();

  if (crop) {
    pipeline = pipeline.extract(crop);
  }

  pipeline = pipeline
    .resize({
      width: crop ? 2000 : 2400,
      withoutEnlargement: false
    })
    .grayscale()
    .normalize();

  if (mode === "threshold") {
    pipeline = pipeline
      .linear(1.35, -25)
      .threshold(170);
  } else if (mode === "high-contrast") {
    pipeline = pipeline
      .linear(1.5, -35)
      .sharpen({ sigma: 1.5 });
  } else {
    pipeline = pipeline.sharpen({ sigma: 1.3 });
  }

  await pipeline.png().toFile(processedImage);

  return processedImage;
};

export const performOCR = async (imagePath) => {
  const images = [];

  try {
    const metadata = await sharp(imagePath)
      .rotate()
      .metadata();

    const width = metadata.width || 0;
    const height = metadata.height || 0;

    // 1. Full image - normal
    images.push(
      await makeProcessedImage(
        imagePath,
        "ocr-normal",
        "normal"
      )
    );

    // 2. Full image - threshold
    images.push(
      await makeProcessedImage(
        imagePath,
        "ocr-threshold",
        "threshold"
      )
    );

    // 3. Full image - high contrast
    images.push(
      await makeProcessedImage(
        imagePath,
        "ocr-contrast",
        "high-contrast"
      )
    );

    /*
     * Packaged commodity declarations are usually present
     * in the lower/right portion of the package.
     *
     * Dedicated crop helps OCR read:
     * MRP
     * USP
     * MFG DATE
     * USE BY
     * NET WEIGHT
     * BATCH NO.
     */
    if (width > 0 && height > 0) {
      const declarationCrop = {
        left: Math.floor(width * 0.32),
        top: Math.floor(height * 0.50),
        width: Math.floor(width * 0.68),
        height: Math.floor(height * 0.50)
      };

      images.push(
        await makeProcessedImage(
          imagePath,
          "ocr-declarations",
          "normal",
          declarationCrop
        )
      );

      images.push(
        await makeProcessedImage(
          imagePath,
          "ocr-declarations-threshold",
          "threshold",
          declarationCrop
        )
      );

      images.push(
        await makeProcessedImage(
          imagePath,
          "ocr-declarations-contrast",
          "high-contrast",
          declarationCrop
        )
      );
    }

    const worker = await createWorker("eng");

    const results = [];

    try {
      for (const image of images) {
        for (const psm of ["6", "11"]) {
          await worker.setParameters({
            tessedit_pageseg_mode: psm,
            preserve_interword_spaces: "1"
          });

          const result = await worker.recognize(image);

          const data = result.data || {};

          const words = (data.words || [])
            .map((word) => ({
              text: word.text || "",
              confidence: Number(word.confidence || 0),
              bbox: word.bbox || null
            }))
            .filter((word) => word.text.trim());

          results.push({
            text: data.text || "",
            confidence: Number(data.confidence || 0),
            words
          });
        }
      }
    } finally {
      await worker.terminate();
    }

    /*
     * Keep the highest confidence result for overall OCR confidence.
     */
    results.sort(
      (a, b) => b.confidence - a.confidence
    );

    /*
     * Combine unique OCR lines from all preprocessing passes.
     *
     * Declaration-related lines are intentionally added first
     * because they are the most important for compliance checking.
     */
    const declarationResults = results.filter((result) =>
      /mrp|usp|mfg|mfd|manufactur|use\s*by|best\s*before|net\s*(weight|quantity)|batch|consumer|marketed\s*by/i.test(
        result.text
      )
    );

    const otherResults = results.filter(
      (result) => !declarationResults.includes(result)
    );

    const orderedResults = [
      ...declarationResults,
      ...otherResults
    ];

    const seen = new Set();
    const combinedLines = [];

    for (const result of orderedResults) {
      for (const line of String(result.text).split(/\r?\n/)) {
        const cleaned = line
          .replace(/[ \t]+/g, " ")
          .trim();

        if (!cleaned) continue;

        const key = cleaned.toLowerCase();

        if (!seen.has(key)) {
          seen.add(key);
          combinedLines.push(cleaned);
        }
      }
    }

    const best =
      results[0] || {
        text: "",
        confidence: 0,
        words: []
      };

    return {
      text: combinedLines.join("\n"),
      confidence: best.confidence,
      words: best.words
    };
  } finally {
    for (const file of images) {
      try {
        fs.unlinkSync(file);
      } catch {}
    }
  }
};