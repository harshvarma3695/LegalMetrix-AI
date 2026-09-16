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
      width: crop ? 2600 : 2800,
      withoutEnlargement: false,
    })
    .grayscale()
    .normalize();

  if (mode === "threshold") {
    pipeline = pipeline
      .linear(1.25, -20)
      .threshold(165)
      .sharpen({ sigma: 1.2 });
  } else if (mode === "high-contrast") {
    pipeline = pipeline
      .linear(1.45, -30)
      .sharpen({ sigma: 1.5 });
  } else {
    pipeline = pipeline.sharpen({
      sigma: 1.3,
    });
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

    images.push(
      await makeProcessedImage(
        imagePath,
        "ocr-normal",
        "normal"
      )
    );

    images.push(
      await makeProcessedImage(
        imagePath,
        "ocr-threshold",
        "threshold"
      )
    );

    images.push(
      await makeProcessedImage(
        imagePath,
        "ocr-contrast",
        "high-contrast"
      )
    );

    /*
     * Declaration area.
     */
    if (width > 0 && height > 0) {
      const crop = {
        left: Math.floor(width * 0.20),
        top: Math.floor(height * 0.35),
        width: Math.floor(width * 0.80),
        height: Math.floor(height * 0.65),
      };

      images.push(
        await makeProcessedImage(
          imagePath,
          "ocr-label",
          "normal",
          crop
        )
      );

      images.push(
        await makeProcessedImage(
          imagePath,
          "ocr-label-threshold",
          "threshold",
          crop
        )
      );

      images.push(
        await makeProcessedImage(
          imagePath,
          "ocr-label-contrast",
          "high-contrast",
          crop
        )
      );
    }

    /*
     * English only.
     *
     * This avoids the OSD language warning.
     */
    const worker = await createWorker("eng");

    const results = [];

    try {
      for (const image of images) {
        /*
         * PSM 6 = block of text
         * PSM 11 = sparse text
         */
        for (const psm of ["6", "11"]) {
          await worker.setParameters({
            tessedit_pageseg_mode: psm,
            preserve_interword_spaces: "1",
          });

          const result =
            await worker.recognize(image);

          const data =
            result.data || {};

          const words =
            (data.words || [])
              .map((word) => ({
                text: word.text || "",
                confidence:
                  Number(
                    word.confidence || 0
                  ),
                bbox:
                  word.bbox || null,
              }))
              .filter(
                (word) =>
                  word.text.trim()
              );

          results.push({
            text: data.text || "",
            confidence:
              Number(
                data.confidence || 0
              ),
            words,
          });
        }
      }
    } finally {
      await worker.terminate();
    }

    if (!results.length) {
      return {
        text: "",
        confidence: 0,
        words: [],
      };
    }

    /*
     * Highest confidence first.
     */
    results.sort(
      (a, b) =>
        b.confidence - a.confidence
    );

    /*
     * Put declaration OCR first.
     */
    const declarationResults =
      results.filter((result) =>
        /mrp|m\.r\.p|usp|mfg|mfd|manufactur|marketed|packed|imported|country|origin|net|weight|quantity|batch|consumer|customer|care|email|call/i.test(
          result.text
        )
      );

    const otherResults =
      results.filter(
        (result) =>
          !declarationResults.includes(
            result
          )
      );

    const orderedResults = [
      ...declarationResults,
      ...otherResults,
    ];

    const seen = new Set();
    const combinedLines = [];

    for (const result of orderedResults) {
      for (const line of String(
        result.text
      ).split(/\r?\n/)) {
        const cleaned = line
          .replace(/[ \t]+/g, " ")
          .replace(/[|]+/g, " ")
          .trim();

        if (!cleaned) continue;

        const key = cleaned
          .toLowerCase()
          .replace(/\s+/g, " ");

        if (!seen.has(key)) {
          seen.add(key);
          combinedLines.push(
            cleaned
          );
        }
      }
    }

    const best =
      results[0] || {
        text: "",
        confidence: 0,
        words: [],
      };

    return {
      text:
        combinedLines.join("\n"),

      confidence:
        best.confidence,

      words:
        best.words,
    };
  } finally {
    for (const file of images) {
      try {
        fs.unlinkSync(file);
      } catch {}
    }
  }
};