import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { PrismaClient } from '@prisma/client';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const prisma = new PrismaClient(); // 내 로컬 DB 호환 유지

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

    // 1. 구글 제미나이를 통한 도안 정밀 분석
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      config: {
        tools: [{ googleSearch: {} }]
      },
      contents: [
        filePart,
        `당신은 뜨개질 도안 및 글로벌/국산 실 정보 전문 분석가입니다. 첨부된 파일(이미지 또는 PDF)을 분석하여 아래 JSON 구조로 응답해주세요.
        
        [게이지(gauge) 규칙]:
        - '코', '단', 'sts', 'rows' 같은 문자는 무조건 제외하고 "오직 숫자와 파란하트(💙) 기호"만 넣으세요. 숫자와 기호 사이에 공백(띄어쓰기)은 절대 넣지 마세요. (예: 22💙30)
        - 게이지 정보가 전혀 발견되지 않는다면 무조건 숫자 '0' 하나만 적으세요.

        [종류(type) 예외 처리 규칙]:
        - 의류의 종류는 반드시 아래 제공된 7개의 단어 중 도안과 가장 일치하는 딱 '하나'만 선택해서 대답해야 합니다. 새로운 단어를 임의로 만들어내면 절대 안 됩니다.
        - 만약 도안이 소품도 아니고, 아래 옷 종류 중 그 어디에도 해당하지 않는 완전 엉뚱한 것이거나 판별하기 어렵다면 무조건 "기타"를 선택하세요.
        - 허용된 종류 목록: ["스웨터", "대바늘 소품", "조끼", "가디건", "치우❤️", "코바늘", "기타"]

        [원작 실 성분(yarnComponent) 및 비율 정렬 규칙]:
        - 도안에 실 성분이 없더라도 구글 검색 도구를 활용해 인터넷에서 해당 원작 실의 성분을 반드시 찾아내세요.
        - 찾아낸 실 성분을 적을 때는 반드시 성분 비율(%)이 높은 순서대로 내림차순 정렬하여 한글로 깔끔하게 나열해 주세요. (예: "울 70% / 아크릴 20% / 나일론 10%")
        - 인터넷 검색으로도 도저히 찾을 수 없는 희귀 사설 실인 경우에만 "-"라고 적으세요.

        [영어 도안 판별 및 특징(note) 규칙 - 슬래시(/) 필수]:
        - 분석 중인 도안이 '영어'로 작성된 도안인지 확인하세요. 영어 도안인 경우, 'note' 칸의 가장 첫머리에 반드시 "영어" 단어를 넣으세요.
        - 특징 항목들을 나열할 때는 쉼표(,)를 절대로 사용하지 말고 슬래시 기호( / )로 구분해 주세요. (예: "영어 / 4mm 바늘 사용 / 탑다운 구조")

        응답 형식(마크다운 태그 없이 순수 JSON만 응답):
        {
          "name": "도안 이름",
          "gauge": "22💙30 형식의 공백 없는 순수 숫자와 하트 조합",
          "type": "허용된 7개 목록 중 하나",
          "yarn": "원작 실 이름",
          "yarnComponent": "구글 검색을 통해 알아내고 % 높은 순으로 정렬한 실의 성분 정보",
          "note": "항목들을 쉼표가 아닌 ' / '로 구분한 핵심 특이사항 요약"
        }`
      ]
    });

    const text = response.text || '{}';
    const cleanJson = text.replace(/```json|```/g, '').trim();
    const aiResult = JSON.parse(cleanJson);

    // 2. 내 데이터베이스(Prisma)에 영구 저장 (껐다 켜도 살아있게 함)
    const savedData = await prisma.pattern.create({
      data: {
        name: aiResult.name || '이름 없는 도안',
        gauge: aiResult.gauge || '0',
        type: aiResult.type || '기타',
        yarn: aiResult.yarn || '-',
        yarnComponent: aiResult.yarnComponent || '-',
        note: aiResult.note || '-'
      }
    });

    // 3. 노션 환경변수 검증
    const notionToken = process.env.NOTION_TOKEN;
    const databaseId = process.env.NOTION_DATABASE_ID;

    if (!notionToken || !databaseId) {
      return NextResponse.json({ error: '노션 환경 변수 세팅이 누락되었습니다.' }, { status: 400 });
    }

    // 4. 🚚 노션 API 배달원을 통해 내 노션 표로 전송
    const notionResponse = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionToken}`,
        'Notion-Version': '2022-06-28', // 🟢 호환성이 가장 높은 버전으로 안정화
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties: {
          // ⚠️ 여기서 노션 표 제목에 맞게 따옴표 안의 단어들을 꼭 수정해 주세요!
          "이름": { 
            title: [{ text: { content: aiResult.name || '이름 없는 도안' } }]
          },
          "게이지": {
            rich_text: [{ text: { content: aiResult.gauge || '0' } }]
          },
          "종류": {
            select: { name: aiResult.type || '기타' }
          },
          "원작 실": {
            rich_text: [{ text: { content: aiResult.yarn || '-' } }]
          },
          "원작 실 성분": {
            rich_text: [{ text: { content: aiResult.yarnComponent || '-' } }]
          },
          "특징": {
            rich_text: [{ text: { content: aiResult.note || '-' } }]
          }
        }
      }),
    });

    if (!notionResponse.ok) {
      const errorData = await notionResponse.json();
      console.error('노션 API 전송 실패 로그:', errorData);
      return NextResponse.json({ error: '노션 전송 실패', details: errorData.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: savedData });

  } catch (error: any) {
    console.error('시스템 에러:', error);
    return NextResponse.json({ error: '서버 에러 발생', details: error.message }, { status: 500 });
  }
}
