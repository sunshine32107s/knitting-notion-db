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
      
      setStatusMessage('🎉 분석 완료! 내 서랍장으로 배달했습니다! 💙');
      setShowNotionBtn(true);
    } catch (error) {
      setStatusMessage('❌ 전송 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    // 🛠️ 노션 위젯 내부에서 꽉 차게 보이도록 bg-gradient 배경을 투명(bg-transparent)으로 빼고 패딩을 확 줄였습니다!
    <div className="w-full min-h-screen p-2 text-gray-900 font-sans tracking-wide flex flex-col items-center justify-center bg-transparent">
      <link href="https://fonts.googleapis.com/css2?family=Gowun+Dodum&display=swap" rel="stylesheet" />
      <style>{`.custom-cute-font { font-family: 'Gowun Dodum', sans-serif; }`}</style>

      <div className="w-full max-w-sm space-y-4 custom-cute-font text-center">
        
        <div className="space-y-1 flex flex-col items-center">
          <img src="/whale_m.gif" alt="title whale" className="w-16 h-16 object-contain animate-bounce" />
          <h1 className="text-xl font-bold text-sky-950 tracking-tight">고래고래 노션 배달소</h1>
          <p className="text-xs text-sky-700/80">도안을 던지면 아래 표에 바로 채워져요!</p>
        </div>

        <div 
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => { e.preventDefault(); setDragActive(false); if(e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]); }}
          // 🛠️ 위젯 크기에 맞게 내부 알맹이 사이즈를 슬림하게 압축했습니다.
          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all shadow-sm ${
            dragActive ? 'border-sky-400 bg-sky-50/50' : 'border-sky-200 bg-white/90 backdrop-blur-sm hover:border-sky-300'
          }`}
          onClick={() => !loading && document.getElementById('fileInput')?.click()}
        >
          <input id="fileInput" type="file" accept="image/*,application/pdf" className="hidden" disabled={loading} onChange={(e) => { if(e.target.files?.[0]) handleFileUpload(e.target.files[0]); }} />
          
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-2">
              <img src="/whale.gif" alt="whale loading" className="w-12 h-12 object-contain" />
              <p className="text-xs font-medium text-sky-800 animate-pulse">{statusMessage}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-2">
              <Upload className="w-6 h-6 text-sky-400" />
              <p className="text-xs font-medium text-gray-600">여기에 도안을 올려주세요</p>
              <p className="text-[10px] text-gray-400">클릭하거나 드래그 가능</p>
            </div>
          )}
        </div>

        {statusMessage && !loading && (
          <div className="space-y-2 p-4 bg-white/95 border border-sky-100 rounded-xl shadow-sm text-xs font-medium text-gray-700">
            <div>{statusMessage}</div>
            {showNotionBtn && (
              <a 
                href={NOTION_PAGE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-3 rounded-lg shadow-2.5 transition-all text-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                새 창으로 표 크게 보기
              </a>
            )}
          </div>
        )}
        
      </div>
    </div>
  );
}
