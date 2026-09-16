# LegalMetriX AI — SIH26034

AI-assisted screening system for checking packaged commodity label declarations under the Legal Metrology (Packaged Commodities) Rules baseline.

## Stack
- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express
- Database: MongoDB / Mongoose
- OCR: Tesseract.js + Sharp
- Reports: PDFKit + DOCX

## Run locally

### 1. Backend
```bash
cd server
npm install
```

Create `server/.env` using `.env.example` and set your MongoDB URI and JWT secret.

```bash
node server.js
```

Backend health check:
`http://localhost:5000/api/health`

### 2. Frontend
```bash
cd client
npm install
npm run dev
```

Optional API override:
```env
VITE_API_URL=http://localhost:5000/api
```

## Main workflow
1. Open **Scan Product**.
2. Upload a clear JPG/JPEG/PNG/WEBP label image.
3. OCR extracts visible text.
4. Product fields are extracted.
5. Declaration checks are evaluated.
6. Readability and OCR evidence are stored.
7. The inspection is saved to MongoDB.
8. Dashboard and History read the real saved data.
9. Reports can be opened by Inspection ID and exported as PDF/DOCX.

## Important
This is an AI-assisted screening tool. It does not replace statutory/legal determination by an authorized inspector. OCR confidence is not a legal measurement of font size or principal-display-panel placement.
