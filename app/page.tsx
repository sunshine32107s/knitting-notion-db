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
    setStatusMessage('고래가 코수와 단수를 확인하고 있어요...');
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('분석 실패');
      
      setStatusMessage('🎉 분석 완료! 내 서랍장으로 안전하게 배달해 드렸어요! 💙');
      setShowNotionBtn(true);
    } catch (error) {
      setStatusMessage('❌ 전송 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    // 🛠️ 최외곽 박스 자체에 rounded-[30px]를 적용하고, 내부 요소가 튀어나가지 않게 overflow-hidden을 주어 완벽한 둥근 모서리를 만들었습니다!
    <div className="w-full min-h-screen p-4 text-slate-900 font-sans tracking-wide flex flex-col items-center justify-center bg-gradient-to-tr from-sky-100 via-blue-50 to-emerald-50 antialiased rounded-[30px] overflow-hidden">
      <link href="https://fonts.googleapis.com/css2?family=Gowun+Dodum:wght@400;700&display=swap" rel="stylesheet" />
      <style>{`.custom-cute-font { font-family: 'Gowun Dodum', sans-serif; }`}</style>

      <div className="w-full max-w-sm space-y-4 custom-cute-font text-center">
        
        <div className="space-y-1 flex flex-col items-center">
          <img src="/whale_m.gif" alt="title whale" className="w-16 h-16 object-contain animate-bounce" />
          <h1 className="text-xl font-extrabold text-sky-950 tracking-tight">고래고래 도안 배달원</h1>
          <p className="text-xs font-bold text-sky-900">고래고래가 열심히 읽어서 배달해 드립니다💙</p>
        </div>

        {/* 🛠️ 파일 던지는 점선 박스 모서리도 시계 위젯 감성에 맞춰 rounded-2xl에서 rounded-[24px]로 더욱 동글동글하게 깎았습니다. */}
        <div 
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => { e.preventDefault(); setDragActive(false); if(e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]); }}
          className={`border-2 border-dashed rounded-[24px] p-5 text-center cursor-pointer transition-all shadow-sm ${
            dragActive ? 'border-sky-500 bg-sky-50/50' : 'border-sky-300 bg-white/95 backdrop-blur-sm hover:border-sky-400'
          }`}
          onClick={() => !loading && document.getElementById('fileInput')?.click()}
        >
          <input id="fileInput" type="file" accept="image/*,application/pdf" className="hidden" disabled={loading} onChange={(e) => { if(e.target.files?.[0]) handleFileUpload(e.target.files[0]); }} />
          
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-2">
              <img src="/whale.gif" alt="whale loading" className="w-12 h-12 object-contain" />
              <p className="text-xs font-extrabold text-sky-950 bg-white/40 px-2 py-0.5 rounded">{statusMessage}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-2">
              <Upload className="w-6 h-6 text-sky-500 stroke-[2.5]" />
              <p className="text-xs font-bold text-slate-800">여기에 도안을 올려주세요</p>
              <p className="text-[10px] font-bold text-slate-500">클릭하거나 드래그 가능</p>
            </div>
          )}
        </div>

        {statusMessage && !loading && (
          // 🛠️ 완료 알림 메시지창 모서리도 부드러운 맛을 살려 똑같이 rounded-[20px]로 굴렸습니다.
          <div className="space-y-2 p-4 bg-white border border-sky-200 rounded-[20px] shadow-md text-xs font-extrabold text-slate-800 animate-in fade-in">
            <div className="leading-relaxed">{statusMessage}</div>
            {showNotionBtn && (
              <a 
                href={NOTION_PAGE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-3 rounded-xl shadow-sm transition-all text-xs"
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
