'use client';

import { useState } from 'react';
import { Upload, ExternalLink } from 'lucide-react';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [showNotionBtn, setShowNotionBtn] = useState(false);

  const NOTION_PAGE_URL = "https://app.notion.com/p/2b7e2f78e8bf80c39febc73fce9422dc?v=2b7e2f78e8bf8057ba2f000cb510c490";

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    setShowNotionBtn(false);
    setStatusMessage('고래가 코수와 단수를 확인하고 있어요💙');
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('분석 실패');
      
      setStatusMessage('🎉 분석 완료! 내 서랍장으로 배달했습니다! 💙');
      setShowNotionBtn(true);
    } catch (error) {
      setStatusMessage('❌ 전송 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    // text-slate-900과 antialiased 속성을 주어 글씨가 흐릿하게 번지는 현상을 방지했습니다.
    <div className="w-full min-h-screen p-4 text-slate-900 font-sans tracking-wide flex flex-col items-center justify-center bg-gradient-to-tr from-sky-100 via-blue-50 to-emerald-50 antialiased">
      <link href="https://fonts.googleapis.com/css2?family=Gowun+Dodum:wght@400;700&display=swap" rel="stylesheet" />
      <style>{`.custom-cute-font { font-family: 'Gowun Dodum', sans-serif; }`}</style>

      <div className="w-full max-w-sm space-y-4 custom-cute-font text-center">
        
        <div className="space-y-1 flex flex-col items-center">
          <img src="/whale_m.gif" alt="title whale" className="w-16 h-16 object-contain animate-bounce" />
          {/* 🛠️ 타이틀 글씨 두께를 더 진하게(font-extrabold) 바꾸고 색상을 묵직한 딥블루로 고정했습니다. */}
          <h1 className="text-xl font-extrabold text-sky-950 tracking-tight">고래고래 도안 배달소</h1>
          {/* 🛠️ 부제목도 흐릿한 투명도를 제거하고 font-bold(굵게)로 변경하여 선명도를 높였습니다. */}
          <p className="text-xs font-bold text-sky-900">도안을 던지면 아래 표에 바로 채워져요!</p>
        </div>

        <div 
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => { e.preventDefault(); setDragActive(false); if(e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]); }}
          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all shadow-sm ${
            dragActive ? 'border-sky-500 bg-sky-50/50' : 'border-sky-300 bg-white/95 backdrop-blur-sm hover:border-sky-400'
          }`}
          onClick={() => !loading && document.getElementById('fileInput')?.click()}
        >
          <input id="fileInput" type="file" accept="image/*,application/pdf" className="hidden" disabled={loading} onChange={(e) => { if(e.target.files?.[0]) handleFileUpload(e.target.files[0]); }} />
          
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-2">
              <img src="/whale.gif" alt="whale loading" className="w-12 h-12 object-contain" />
              {/* 🛠️ 로딩 중 안내 멘트도 아주 굵고 진하게 세팅했습니다. */}
              <p className="text-xs font-extrabold text-sky-950 bg-white/40 px-2 py-0.5 rounded">{statusMessage}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-2">
              <Upload className="w-6 h-6 text-sky-500 stroke-[2.5]" />
              {/* 🛠️ 점선 박스 안의 안내 글자들을 font-bold로 싹 업그레이드했습니다. */}
              <p className="text-xs font-bold text-slate-800">여기에 도안을 올려주세요</p>
              <p className="text-[10px] font-bold text-slate-500">클릭하거나 드래그 가능</p>
            </div>
          )}
        </div>

        {statusMessage && !loading && (
          // 🛠️ 완료 메시지 창의 글씨들도 가독성을 위해 완전히 짙고 선명한 색으로 고정했습니다.
          <div className="space-y-2 p-4 bg-white border border-sky-200 rounded-xl shadow-md text-xs font-extrabold text-slate-800 animate-in fade-in">
            <div className="leading-relaxed">{statusMessage}</div>
            {showNotionBtn && (
              <a 
                href={NOTION_PAGE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-3 rounded-lg shadow-sm transition-all text-xs"
              >
                <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
                새 창으로 표 크게 보기
              </a>
            )}
          </div>
        )}
        
      </div>
    </div>
  );
}
