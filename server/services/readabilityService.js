export function analyzeReadability(ocrWords = []) {
  return ocrWords.map((word) => {
    const confidence = Number(word.confidence || 0);

    let status = "readable";

    if (confidence < 50) {
      status = "needs_review";
    } else if (confidence < 75) {
      status = "fair";
    }

    return {
      text: word.text,
      confidence,
      bbox: word.bbox,
      status,

      note:
        "OCR confidence is an image-quality indicator; it is not a legal font-size measurement."
    };
  });
}