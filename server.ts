import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON payload parser limit for image & PDF base64 uploads
  app.use(express.json({ limit: "30mb" }));
  app.use(express.urlencoded({ limit: "30mb", extended: true }));

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      timestamp: new Date().toISOString()
    });
  });

  // Gemini Smart Extraction API route
  app.post("/api/gemini/extract", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({
          error: "GEMINI_API_KEY가 설정되지 않았습니다. AI Studio Secrets 패널에서 API 키를 설정해주세요."
        });
      }

      const { base64Data, mimeType, fileName } = req.body;

      if (!base64Data || !mimeType) {
        return res.status(400).json({
          error: "분석할 파일 데이터(base64Data, mimeType)가 누락되었습니다."
        });
      }

      // Initialize Gemini SDK with User-Agent header as required
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      // Call Gemini 3.6 Flash model for document analysis
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data,
              },
            },
            {
              text: `다음 첨부된 대한민국 교직원 연수 이수증/수료증 문서(파일명: ${fileName || '문서'})를 분석하여 필요한 필수 정보를 정확히 추출해 주세요.

목표 extraction 항목:
1. trainingName: 정확한 연수명 (과정명, 교육과정명). 부제나 회차가 포함된 경우 전체 명칭.
2. certificateNumber: 이수증/수료증 고유 등록 번호 (예: 제 2026-1234호, 제2025-0987호, No. 12345 등 문맥상 이수증 번호).
3. submitterName: 이수자 성명 (문서 내에 적힌 성명/교육생 이름).
4. institution: 발급 및 주관 연수기관 이름 (예: 중앙교육연수원, 서울특별시교육청교육연수원 등).
5. completionHours: 이수 시간 및 학점 (예: 15시간, 30시간, 2학점 등).
6. completionDate: 이수일자 또는 발급일자 (예: 2026.05.20 또는 2026년 5월 20일).
7. confidence: 추출 정확성 및 읽기 신뢰도 ('high', 'medium', 'low').
8. summary: 문서 종류 및 인식 결과 요약 (1~2문장).

추출이 불분명하거나 문서에 해당 항목이 없으면 빈 문자열("")로 입력하세요.`,
            },
          ],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              trainingName: { type: Type.STRING, description: "연수명" },
              certificateNumber: { type: Type.STRING, description: "이수증 번호" },
              submitterName: { type: Type.STRING, description: "이수자 성명" },
              institution: { type: Type.STRING, description: "연수 기관명" },
              completionHours: { type: Type.STRING, description: "이수 시간" },
              completionDate: { type: Type.STRING, description: "이수일자" },
              confidence: { type: Type.STRING, description: "신뢰도 ('high', 'medium', 'low')" },
              summary: { type: Type.STRING, description: "추출 내용 요약" },
            },
            required: ["trainingName", "certificateNumber", "confidence", "summary"],
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        return res.status(500).json({ error: "Gemini 응답 데이터가 비어 있습니다." });
      }

      const extractedJson = JSON.parse(responseText);
      return res.json({
        success: true,
        data: extractedJson,
      });
    } catch (err: any) {
      console.error("Gemini Extraction Error:", err);
      return res.status(500).json({
        error: err.message || "이수증 자동 분석 중 오류가 발생했습니다.",
      });
    }
  });

  // Google Apps Script Proxy Endpoint to safely submit data without CORS issues
  app.post("/api/submit-proxy", async (req, res) => {
    try {
      const { gasUrl, payload } = req.body;

      if (!gasUrl) {
        return res.status(400).json({ error: "Google Apps Script 배포 URL이 제공되지 않았습니다." });
      }

      // Send server-side POST request to GAS Web App URL
      const response = await fetch(gasUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      let responseJson;
      try {
        responseJson = JSON.parse(responseText);
      } catch {
        responseJson = { raw: responseText };
      }

      return res.json({
        success: response.ok,
        status: response.status,
        data: responseJson,
      });
    } catch (err: any) {
      console.error("GAS Submit Proxy Error:", err);
      return res.status(500).json({
        error: err.message || "Google 시트로 제출 전송 중 네트워크 오류가 발생했습니다.",
      });
    }
  });

  // Vite middleware setup for development vs static serve for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
