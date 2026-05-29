import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const filePart = {
      inlineData: {
        data: buffer.toString('base64'),
        mimeType: file.type
      }
    };

    // 1. 구글 제미나이 AI 도안 분석
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      config: {
        responseMimeType: "application/json"
      },
      contents: [
        filePart,
        `당신은 뜨개질 도안 전문 분석가입니다. 첨부된 파일(이미지 또는 PDF)을 분석하여 아래 JSON 구조로 응답해주세요.
        
        [게이지(gauge) 규칙]:
        - '코', '단', 'sts', 'rows' 같은 문자는 무조건 제외하고 "오직 숫자와 파란하트(💙) 기호"만 넣으세요. 숫자와 기호 사이에 공백(띄어쓰기)은 절대 넣지 마세요. (예: 22💙30)
        - 게이지 정보가 전혀 발견되지 않는다면 무조건 숫자 '0' 하나만 적으세요.

        [종류(type) 규칙]:
        - 의류의 종류는 반드시 아래 제공된 6개의 단어 중 도안과 가장 일치하는 딱 '하나'만 선택해서 대답해야 합니다. 새로운 단어를 임의로 만들어내면 절대 안 됩니다.
        - 허용된 종류 목록: ["스웨터", "대바늘 소품", "조끼", "가디건", "치우❤️", "코바늘"]

        [영어 도안 판별 및 특징(note) 규칙 - 슬래시(/) 필수]:
        - 분석 중인 도안이 '영어'로 작성된 도안인지 확인하세요. 영어 도안인 경우, 'note' 칸의 가장 첫머리에 반드시 "영어" 단어를 넣으세요.
        - 특징 항목들을 나열할 때는 쉼표(,)를 절대로 사용하지 말고 슬래시 기호( / )로 구분해 주세요. (예: "영어 / 4mm 바늘 사용 / 탑다운 구조")

        응답 형식:
        {
          "name": "도안 이름",
          "gauge": "22💙30 형식의 공백 없는 순수 숫자와 하트 조합",
          "type": "한글로 된 의류 종류",
          "yarn": "원작 실 이름",
          "yarnComponent": "도안에서 찾아낸 실의 성분 정보",
          "note": "항목들을 쉼표가 아닌 ' / '로 구분한 핵심 특이사항 요약"
        }`
      ]
    });

    const text = response.text || '{}';
    const aiResult = JSON.parse(text);

    // 2. 노션 환경변수 검증
    const notionToken = process.env.NOTION_TOKEN;
    const databaseId = "2b7e2f78e8bf8068b319000b82494d33";

    if (!notionToken || !databaseId) {
      return NextResponse.json({ error: '노션 환경 변수 세팅이 누락되었습니다.' }, { status: 500 });
    }

    // 최신 API 버전(2022-06-28 이후)에서는 없는 선택(Select) 값을 넣으면 에러가 납니다.
    // 도안 종류가 지정된 6개 외의 값이 오면 에러가 나지 않도록 처리합니다.
    const allowedTypes = ["스웨터", "대바늘 소품", "조끼", "가디건", "치우❤️", "코바늘"];
    const verifiedType = allowedTypes.includes(aiResult.type) ? aiResult.type : null;

    // 3. 노션 API 전송 (헤더 버전을 최신으로 수정)
    const notionResponse = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionToken}`,
        'Notion-Version': '2026-03-31', // 👈 최신 API 버전 적용
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties: {
          "이름": {
            title: [{ text: { content: aiResult.name || '이름 없는 도안' } }]
          },
          "게이지": {
            rich_text: [{ text: { content: aiResult.gauge || '0' } }]
          },
          // 종류가 일치하지 않으면 아예 비워두어 에러를 방지합니다.
          ...(verifiedType && {
            "종류": {
              select: { name: verifiedType }
            }
          }),
          "특징": {
            rich_text: [{ text: { content: aiResult.note || '-' } }]
          },
          "원작 실": {
            rich_text: [{ text: { content: aiResult.yarn || '-' } }]
          },
          "원작 실 성분": {
            rich_text: [{ text: { content: aiResult.yarnComponent || '-' } }]
          }
        }
      }),
    });

    if (!notionResponse.ok) {
      const errorData = await notionResponse.json();
      console.error('노션 API 전송 실패:', errorData);
      return NextResponse.json({ error: '노션 전송 실패', details: errorData.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: aiResult });

  } catch (error: any) {
    console.error('시스템 에러:', error);
    return NextResponse.json({ error: '서버 에러 발생', details: error.message }, { status: 500 });
  }
}
