const express = require("express");

const multer = require("multer");

const path = require("path");

const fs = require("fs");

const os = require("os");

const { promisify } = require("util");

const { execFile } = require("child_process");

const { PDFParse } = require("pdf-parse");

const poppler = require("pdf-poppler");

const Document = require("../models/Document");

const LearningActivity = require("../models/LearningActivity");

const router = express.Router();

const execFileAsync = promisify(execFile);

const TESSERACT_PATH =
  "C:\\Program Files\\Tesseract-OCR\\tesseract.exe";

// ===============================
// MULTER CONFIGURATION
// ===============================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9);

    cb(
      null,
      uniqueName + path.extname(file.originalname)
    );
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(
      new Error("Only PDF files are allowed"),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

// ===============================
// OCR FUNCTION
// ===============================

async function extractTextWithOCR(pdfPath) {
  console.log("🔎 Starting OCR...");

  const tempFolder = path.join(
    os.tmpdir(),
    "studyvault-ocr"
  );

  fs.mkdirSync(tempFolder, {
    recursive: true,
  });

  const outputPrefix = path.join(
    tempFolder,
    `studyvault-${Date.now()}`
  );

  try {
    console.log(
      "🖼️ Converting PDF pages to images..."
    );

    await poppler.convert(pdfPath, {
      format: "png",
      out_dir: tempFolder,
      out_prefix: path.basename(outputPrefix),
      scale: 1500,
    });

    const files = fs
      .readdirSync(tempFolder)
      .filter((file) =>
        file.startsWith(
          path.basename(outputPrefix)
        )
      )
      .filter((file) =>
        file.toLowerCase().endsWith(".png")
      )
      .sort((a, b) => {
        const pageA =
          parseInt(
            a.match(/-(\d+)\.png$/)?.[1] || "0"
          );

        const pageB =
          parseInt(
            b.match(/-(\d+)\.png$/)?.[1] || "0"
          );

        return pageA - pageB;
      });

    console.log(
      `📄 Converted ${files.length} PDF pages`
    );

    let fullText = "";

    for (let i = 0; i < files.length; i++) {
      const imagePath = path.join(
        tempFolder,
        files[i]
      );

      const pageNumber = i + 1;

      console.log(
        `🔎 OCR processing page ${pageNumber}/${files.length}...`
      );

      try {
        const { stdout } =
          await execFileAsync(
            TESSERACT_PATH,
            [
              imagePath,
              "stdout",
              "-l",
              "eng",
            ],
            {
              windowsHide: true,
              maxBuffer:
                20 * 1024 * 1024,
            }
          );

        const pageText =
          stdout.trim();

        fullText +=
          `\n\n--- Page ${pageNumber} ---\n\n`;

        fullText += pageText;

        console.log(
          `📝 Page ${pageNumber}: ${pageText.length} characters`
        );
      } catch (ocrError) {
        console.error(
          `⚠️ OCR failed on page ${pageNumber}:`,
          ocrError.message
        );
      }

      // Delete converted image
      try {
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      } catch (deleteError) {
        console.error(
          "⚠️ Could not delete image:",
          deleteError.message
        );
      }
    }

    console.log(
      "✅ OCR completed:",
      fullText.length,
      "characters"
    );

    return fullText.trim();
  } finally {
    // Remove temporary OCR files
    try {
      const remainingFiles =
        fs.readdirSync(tempFolder);

      for (const file of remainingFiles) {
        if (
          file.startsWith(
            path.basename(outputPrefix)
          )
        ) {
          const filePath =
            path.join(
              tempFolder,
              file
            );

          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      }
    } catch (cleanupError) {
      console.error(
        "⚠️ OCR cleanup error:",
        cleanupError.message
      );
    }
  }
}

// ===============================
// GET USER DOCUMENTS
// ===============================

router.get(
  "/:userId",
  async (req, res) => {
    try {
      const { userId } =
        req.params;

      console.log(
        "📚 Fetching documents for user:",
        userId
      );

      const documents =
        await Document.find({
          userId,
        }).sort({
          uploadedAt: -1,
        });

      console.log(
        "📄 Documents found:",
        documents.length
      );

      res.status(200).json({
        documents,
      });
    } catch (error) {
      console.error(
        "❌ Error fetching documents:",
        error
      );

      res.status(500).json({
        message:
          "Failed to fetch documents",

        error:
          error.message,
      });
    }
  }
);

// ===============================
// VIEW DOCUMENT
// ===============================

router.get(
  "/view/:documentId",
  async (req, res) => {
    try {
      const { documentId } =
        req.params;

      console.log(
        "📄 Fetching document:",
        documentId
      );

      const document =
        await Document.findById(
          documentId
        );

      if (!document) {
        return res.status(404).json({
          message:
            "Document not found",
        });
      }

      res.status(200).json({
        document,
      });
    } catch (error) {
      console.error(
        "❌ Error fetching document:",
        error
      );

      res.status(500).json({
        message:
          "Failed to fetch document",

        error:
          error.message,
      });
    }
  }
);

// ===============================
// UPLOAD PDF
// ===============================

router.post(
  "/upload",
  upload.single("document"),

  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message:
            "Please select a PDF file",
        });
      }

      const {
        userId,
        subject,
      } = req.body;

      if (!userId) {
        return res.status(400).json({
          message:
            "User ID is required",
        });
      }

      console.log(
        "📄 PDF received:",
        req.file.originalname
      );

      // ===========================
      // NORMAL PDF TEXT EXTRACTION
      // ===========================

      const pdfBuffer =
        fs.readFileSync(
          req.file.path
        );

      const parser =
        new PDFParse({
          data: pdfBuffer,
        });

      const result =
        await parser.getText();

      await parser.destroy();

      let extractedText =
        result.text || "";

      console.log(
        "📖 Normal text extracted:",
        extractedText.length,
        "characters"
      );

      // ===========================
      // OCR FALLBACK
      // ===========================

      if (
        extractedText.trim().length < 2000
      ) {
        console.log(
          "🖼️ Very little text detected."
        );

        console.log(
          "🔎 PDF may be scanned. Starting OCR..."
        );

        try {
          const ocrText =
            await extractTextWithOCR(
              req.file.path
            );

          if (
            ocrText &&
            ocrText.length >
              extractedText.length
          ) {
            extractedText =
              ocrText;

            console.log(
              "✅ OCR text selected:",
              extractedText.length,
              "characters"
            );
          }
        } catch (ocrError) {
          console.error(
            "⚠️ OCR failed:",
            ocrError.message
          );

          console.log(
            "↪️ Continuing with normal extracted text."
          );
        }
      }

      // ===========================
      // SAVE DOCUMENT
      // ===========================

      const document =
        await Document.create({
          userId,

          filename:
            req.file.filename,

          originalName:
            req.file.originalname,

          subject:
            subject || "General",

          filePath:
            req.file.path,

          extractedText,
        });

      // ===========================
      // SAVE LEARNING ACTIVITY
      // ===========================

      await LearningActivity.create({
        userId,

        documentId:
          document._id,

        activityType:
          "document_upload",

        title:
          "Uploaded Document",

        description:
          document.originalName,

        topic:
          document.subject ||
          "General",
      });

      console.log(
        "📄 Document upload activity saved"
      );

      console.log(
        "💾 Document saved to MongoDB"
      );

      res.status(201).json({
        message:
          "Document uploaded and processed successfully ✅",

        document: {
          id:
            document._id,

          filename:
            document.originalName,

          subject:
            document.subject,

          textLength:
            extractedText.length,
        },
      });
    } catch (error) {
      console.error(
        "❌ Document processing error:",
        error
      );

      if (req.file?.path) {
        try {
          if (
            fs.existsSync(
              req.file.path
            )
          ) {
            fs.unlinkSync(
              req.file.path
            );
          }
        } catch (deleteError) {
          console.error(
            "Could not delete file:",
            deleteError.message
          );
        }
      }

      res.status(500).json({
        message:
          "PDF processing failed",

        error:
          error.message,
      });
    }
  }
);

// ===============================
// DELETE DOCUMENT
// ===============================

router.delete(
  "/:documentId",

  async (req, res) => {
    try {
      const {
        documentId,
      } = req.params;

      console.log(
        "🗑️ Deleting document:",
        documentId
      );

      const document =
        await Document.findById(
          documentId
        );

      if (!document) {
        return res.status(404).json({
          message:
            "Document not found",
        });
      }

      if (document.filePath) {
        try {
          if (
            fs.existsSync(
              document.filePath
            )
          ) {
            fs.unlinkSync(
              document.filePath
            );
          }
        } catch (fileError) {
          console.error(
            "⚠️ Could not delete PDF file:",
            fileError.message
          );
        }
      }

      await Document.findByIdAndDelete(
        documentId
      );

      console.log(
        "✅ Document deleted successfully"
      );

      res.status(200).json({
        message:
          "Document deleted successfully",
      });
    } catch (error) {
      console.error(
        "❌ Error deleting document:",
        error
      );

      res.status(500).json({
        message:
          "Failed to delete document",

        error:
          error.message,
      });
    }
  }
);

module.exports = router;