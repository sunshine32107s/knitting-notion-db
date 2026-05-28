'use client';

import { useState } from 'react';
import { Upload, ExternalLink } from 'lucide-react';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [showNotionBtn, setShowNotionBtn] = useState(false);

  // 🔗 사용자님의 실제 노션 표 주소 연동 완료!
  const NOTION_PAGE_URL = "https://app.notion.com/p/2b7e2f78e8bf80c39febc73fce9422dc?v=2b7e2f78e8bf8057ba2f000cb510c490";

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    setShowNotionBtn(false);
    setStatusMessage('고래가 코수와 단수를 열심히 확인하고 있어요!');
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('분석 실패');
      
      setStatusMessage('🎉 도안 분석 완료! 내 뜨개 서랍장(노션)으로 배달을 완료했습니다! 💙');
      setShowNotionBtn(true);
    } catch (error) {
      setStatusMessage('❌ 도안을 읽거나 노션으로 전송하는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-sky-100 via-blue-50 to-emerald-50 p-4 md:p-8 text-gray-900 font-sans tracking-wide flex flex-col items-center justify-center">
      <link href="https://fonts.googleapis.com/css2?family=Gowun+Dodum&display=swap" rel="stylesheet" />
      <style>{`.custom-cute-font { font-family: 'Gowun Dodum', sans-serif; }`}</style>

      <div className="max-w-md w-full space-y-6 custom-cute-font text-center">
        
        <div className="space-y-2 flex flex-col items-center">
          <img src="/whale_m.gif" alt="title whale" className="w-24 h-24 object-contain animate-bounce" />
          <h1 className="text-3xl font-bold text-sky-900 tracking-tight">고래고래 노션 배달소</h1>
          <p className="text-sm text-sky-600/80">도안을 업로드하면 AI가 분석해서 내 노션 표에 바로 채워줍니다!</p>
        </div>

        <div 
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => { e.preventDefault(); setDragActive(false); if(e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]); }}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all shadow-md ${
            dragActive ? 'border-sky-400 bg-sky-50/50' : 'border-sky-200 bg-white/80 backdrop-blur-sm hover:border-sky-300'
          }`}
          onClick={() => !loading && document.getElementById('fileInput')?.click()}
        >
          <input id="fileInput" type="file" accept="image/*,application/pdf" className="hidden" disabled={loading} onChange={(e) => { if(e.target.files?.[0]) handleFileUpload(e.target.files[0]); }} />
          
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3">
              <img src="/whale.gif" alt="whale loading" className="w-16 h-16 object-contain" />
              <p className="text-sm font-medium text-sky-800">{statusMessage}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-4">
              <Upload className="w-8 h-8 text-sky-400" />
              <p className="text-sm font-medium text-gray-600">여기에 도안 이미지나 PDF를 올려주세요.</p>
              <p className="text-xs text-gray-400">마우스로 드래그하거나 클릭해서 선택할 수 있습니다.</p>
            </div>
          )}
        </div>

        {/* 배달 완료 시 나타나는 메시지 및 바로가기 버튼 */}
        {statusMessage && !loading && (
          <div className="space-y-3 p-5 bg-white/90 backdrop-blur-sm border border-sky-100 rounded-2xl shadow-md text-sm font-medium text-gray-700 animate-in fade-in duration-300">
            <div>{statusMessage}</div>
            
            {showNotionBtn && (
              <a 
                href={NOTION_PAGE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center justify-center gap-2 w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 px-4 rounded-xl shadow-sm transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                내 뜨개 서랍장 확인하러 가기
              </a>
            )}
          </div>
        )}
        
      </div>
    </div>
  );
}
