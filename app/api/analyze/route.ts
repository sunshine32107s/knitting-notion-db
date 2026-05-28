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
    const base64Data = buffer.toString('base64');
    
    const filePart = {
      inlineData: {
        data: base64Data,
        mimeType: file.type
      }
    };

    // 1. 구글 제미나이 AI 도안 정밀 분석
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        filePart,
        `당신은 뜨개질 도안 전문 분석가입니다. 첨부된 파일(이미지 또는 PDF)을 분석하여 아래 JSON 구조로 응답해주세요.
        
        [게이지(gauge) 규칙]:
        - '코', '단', 'sts', 'rows' 같은 문자는 무조건 제외하고 "오직 숫자와 파란하트(💙) 기호"만 넣으세요. 숫자와 기호 사이에 공백(띄어쓰기)은 절대 넣지 마세요. (예: 22💙30)
        - 게이지 정보가 전혀 발견되지 않는다면 무조건 숫자 '0' 하나만 적으세요.

        [종류(type) 규칙]:
        - 의류의 종류는 무조건 100% 한글로만 대답하세요. (예: 풀오버, 가디건, 조끼)

        [영어 도안 판별 및 특징(note) 규칙 - 슬래시(/) 필수]:
        - 분석 중인 도안이 '영어'로 작성된 도안인지 확인하세요. 영어 도안인 경우, 'note' 칸의 가장 첫머리에 반드시 "영어" 단어를 넣으세요.
        - 특징 항목들을 나열할 때는 쉼표(,)를 절대로 사용하지 말고 슬래시 기호( / )로 구분해 주세요. (예: "영어 / 4mm 바늘 사용 / 탑다운 구조")

        응답 형식(마크다운 태그 없이 순수 JSON만 응답):
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
    const cleanJson = text.replace(/```json|```/g, '').trim();
    const aiResult = JSON.parse(cleanJson);

    // 2. 발급받은 환경변수를 통해 노션(Notion) 데이터베이스로 직접 전송
    const notionToken = process.env.NOTION_TOKEN;
    const databaseId = process.env.NOTION_DATABASE_ID;

    if (!notionToken || !databaseId) {
      return NextResponse.json({ error: '노션 환경 변수 세팅이 누락되었습니다.' }, { status: 500 });
    }

    // 사용자가 업로드한 이미지를 노션 미디어로 임시 연동하기 위한 Data URI 생성
    const fileUrl = `data:${file.type};base64,${base64Data}`;

    const notionResponse = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parent: { database_id: databaseId },
        // 💡 내 노션 표의 속성 이름 및 타입 매칭 완료!
        properties: {
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
          "비고": {
            rich_text: [{ text: { content: aiResult.note || '-' } }]
          },
          "착샷": {
            files: [{
              name: file.name || 'pattern_image.png',
              type: 'external',
              external: { url: 'https://images.unsplash.com/photo-1608248597481-496100c80836?w=500' } // 노션 API 제약상 외부 プレースホルダー 주소 지정 후 데이터 본문에 원본 포함 가능
            }]
          }
        },
        // 노션 상세 페이지 본문 안에 원본 도안 이미지를 큼직하게 꽂아줍니다!
        children: [
          {
            object: 'block',
            type: 'image',
            image: {
              type: 'external',
              external: { url: fileUrl }
            }
          }
        ]
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
