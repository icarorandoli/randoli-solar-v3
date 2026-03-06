import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import type { Express, Request, Response } from "express";

const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Tipo de arquivo não permitido. Use PDF, JPG ou PNG."));
    }
  },
});

export function registerUploadRoutes(app: Express): void {
  app.post("/api/uploads", upload.single("file"), (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }
    const objectPath = `/uploads/${req.file.filename}`;
    return res.json({
      uploadURL: objectPath,
      objectPath,
      metadata: {
        name: req.file.originalname,
        size: req.file.size,
        contentType: req.file.mimetype,
      },
    });
  });
}
