import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        error: "GEMINI_API_KEY가 설정되지 않았습니다. Vercel 환경 변수(Environment Variables)에서 GEMINI_API_KEY를 추가해 주세요."
      });
    }

    const { base64Data, mimeType, fileName } = req.body || {};

    if (!base64Data || !mimeType) {
      return res.status(400).json({
        error: "분석할 파일 데이터(base64Data, mimeType)가 누락되었습니다."
      });
    }

    const ai = new GoogleGenAI({ apiKey });

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
설명이나 대화체 문장 없이 오직 요청된 JSON 데이터만 출력하세요.

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

    const responseText = response.text || "";
    let cleanedText = responseText.trim();
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.replace(/^```json\s*/i, "").replace(/\s*```$/, "");
    } else if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    let extractedJson: any = null;
    try {
      extractedJson = JSON.parse(cleanedText);
    } catch {
      const firstBrace = cleanedText.indexOf("{");
      const lastBrace = cleanedText.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        try {
          extractedJson = JSON.parse(cleanedText.substring(firstBrace, lastBrace + 1));
        } catch (e) {
          console.error("JSON parse error:", e);
        }
      }
    }

    if (!extractedJson || typeof extractedJson !== "object") {
      extractedJson = {
        trainingName: "",
        certificateNumber: "",
        submitterName: "",
        institution: "",
        completionHours: "",
        completionDate: "",
        confidence: "low",
        summary: "문서 내용 감지됨 (연수 정보를 직접 입력해 주세요).",
      };
    }

    return res.status(200).json({
      success: true,
      data: extractedJson,
    });
  } catch (err: any) {
    console.error("Gemini Extraction Error:", err);
    return res.status(500).json({
      error: err.message || "이수증 자동 분석 중 오류가 발생했습니다.",
    });
  }
}
