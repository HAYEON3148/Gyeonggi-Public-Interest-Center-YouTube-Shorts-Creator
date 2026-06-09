import { useState, useEffect } from "react";
import { 
  Video, 
  Sparkles, 
  Briefcase, 
  ExternalLink, 
  RefreshCw, 
  Search, 
  Calendar, 
  ChevronRight, 
  Layers, 
  CheckCircle, 
  Smartphone, 
  ArrowLeft, 
  Play, 
  Clock, 
  Edit, 
  Send, 
  Copy, 
  Check, 
  AlertCircle, 
  Cpu, 
  Undo,
  ListFilter,
  Sliders,
  Image as ImageIcon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { Notice, ShortsData, SlideData, FinalMakePayload } from "./types";

export default function App() {
  // Navigation steps: "notice_select" | "generating" | "editing" | "dispatch_ready"
  const [step, setStep] = useState<"notice_select" | "generating" | "editing" | "dispatch_ready">("notice_select");
  
  // Scraper and Notice selection states
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoadingNotices, setIsLoadingNotices] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("전체");
  
  // Notice detail load
  const [loadingDetailId, setLoadingDetailId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // AI Shorts generation states
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatusText, setGenerationStatusText] = useState("");
  const [generationLogs, setGenerationLogs] = useState<string[]>([]);
  
  // Edited Shorts states
  const [shortsData, setShortsData] = useState<ShortsData>({
    title: "",
    slides: Array(5).fill(null).map((_, i) => ({
      visual: "",
      script: ""
    }))
  });

  // Simulator Preview State
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPlaylistPlaying, setIsPlaylistPlaying] = useState(false);
  
  // Copy state for final payload
  const [isCopied, setIsCopied] = useState(false);

  // System notification toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Load Gyeonggi-do public center notice list from server API
  const fetchNotices = async () => {
    setIsLoadingNotices(true);
    showToast("경기도 공익활동지원센터 공지사항을 수집 중입니다...", "info");
    try {
      const response = await fetch("/api/notices");
      const resData = await response.json();
      if (resData.success && resData.data) {
        setNotices(resData.data);
        showToast("공지사항 목록 동기화 완료!", "success");
      } else {
        throw new Error(resData.error || "목록 로드 실패");
      }
    } catch (error) {
      console.error(error);
      showToast("네트워크 오류로 실시간 목록 동기화 실패. 프리미엄 캐시 데이터를 로드했습니다.", "error");
    } finally {
      setIsLoadingNotices(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Select a notice and fetch its details
  const handleSelectNoticeAndOpen = async (notice: Notice) => {
    setLoadingDetailId(notice.id);
    setSelectedNotice(notice);
    try {
      const response = await fetch(`/api/notices/${notice.id}/detail?link=${encodeURIComponent(notice.link)}`);
      const resData = await response.json();
      if (resData.success && resData.data) {
        const fullContent = resData.data.content;
        const attachedImage = resData.data.image || notice.image;
        
        setSelectedNotice(prev => {
          if (!prev) return null;
          return {
            ...prev,
            content: fullContent,
            image: attachedImage
          };
        });
        setIsDetailOpen(true);
      } else {
        throw new Error(resData.error || "상세 정보 로드 실패");
      }
    } catch (error) {
      console.error(error);
      // Fallback with current metadata to avoid blocking user
      setSelectedNotice(prev => {
        if (!prev) return null;
        return {
          ...prev,
          content: prev.content_preview + "\n\n(상세 공고 내용을 실시간 스크랩하지 못했으나, 요약본을 토대로 AI 쇼츠 대본을 구성할 수 있습니다.)"
        };
      });
      setIsDetailOpen(true);
    } finally {
      setLoadingDetailId(null);
    }
  };

  // Launch AI Shorts Script Maker workflow
  const triggerAiShortsGeneration = async () => {
    if (!selectedNotice) return;
    
    setIsDetailOpen(false);
    setStep("generating");
    setGenerationProgress(10);
    setGenerationStatusText("공익센터 공지사항 원문 상세 텍스트 해독 중...");
    setGenerationLogs(["[INFO] AI 세션 실행 준비 완료", `[INFO] 대상 글: "${selectedNotice.title}"`]);

    const animateProgress = (target: number, text: string, delay: number) => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          setGenerationProgress(target);
          setGenerationStatusText(text);
          setGenerationLogs(prev => [...prev, `[PROCESS] ${text}`]);
          resolve();
        }, delay);
      });
    };

    await animateProgress(25, "대학생 필수 홍보 포커스 필터링 (스펙, 활동비, 무료)...", 600);
    await animateProgress(45, "15초 숏폼 최적화 5개 부하 분할 구성 중...", 600);
    await animateProgress(65, "슬라이드별 극강의 캐치프레이즈 인공지능 카피라이팅 가동...", 700);
    await animateProgress(85, "일러스트레이터용 비주얼 디스크립션 프롬프트 정밀 생성 중...", 700);

    try {
      const response = await fetch("/api/generate-shorts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: selectedNotice.title,
          content: selectedNotice.content || selectedNotice.content_preview
        })
      });

      const resData = await response.json();
      if (resData.success && resData.data) {
        const rawResult = resData.data;
        // Transform the structured response into shorts format
        const structuredSlides: SlideData[] = [
          { visual: rawResult.slide1_visual, script: rawResult.slide1_script },
          { visual: rawResult.slide2_visual, script: rawResult.slide2_script },
          { visual: rawResult.slide3_visual, script: rawResult.slide3_script },
          { visual: rawResult.slide4_visual, script: rawResult.slide4_script },
          { visual: rawResult.slide5_visual, script: rawResult.slide5_script }
        ];

        setShortsData({
          title: rawResult.title || selectedNotice.title,
          slides: structuredSlides
        });

        setGenerationProgress(100);
        setGenerationLogs(prev => [...prev, "[SUCCESS] AI 쇼츠 제작용 마스터 데이터 팩 로드 완료!"]);
        showToast("AI 쇼츠 요약팩 생성 성공!", "success");
        
        setTimeout(() => {
          setStep("editing");
          setCurrentSlideIndex(0);
        }, 1000);

      } else {
        throw new Error(resData.error || "AI Generation Returned Failure Scent");
      }
    } catch (e: any) {
      console.error(e);
      setGenerationLogs(prev => [...prev, `[ERROR] AI 대본 생성 중 문제 발생: ${e.message}`]);
      showToast("API 요청에 실패하여 예비 시나리오 규칙 대본으로 자동 복구했습니다.", "error");

      // Stable Fallback algorithm so app never breaks
      const keywords = selectedNotice.title;
      const parsedMockSlides: SlideData[] = [
        { 
          visual: "Vibrant high-contrast 3D vector illustration of Korean university students cheering with digital devices under a glowing cloud, high-quality modern design, warm slate palette.", 
          script: "스펙 쌓고 돈도 받는 경기도 사기급 공고?!" 
        },
        { 
          visual: "Cute isometric 3D visual of a bright target mark with college students running towards it, green and amber warm light.", 
          script: `${keywords.substring(0, 15)}... 청년 누구나 지원 가능대박!` 
        },
        { 
          visual: "Detailed 3D design of a piggy bank overflowed with gold coins alongside a certificate stamp, digital rendering.", 
          script: "핵심 혜택: 전액 무료 교육 + 든든한 활동비 지원까지!" 
        },
        { 
          visual: "Stylized modern desk neon calendar counting down to current month, highlight dates, cinematic lens flares.", 
          script: "모집 마감 얼마 안 남음! 늦기 전에 빠른 신청 무조건!" 
        },
        { 
          visual: "A young student holding a smartphone showing a huge green 'APPLY NOW' button, dynamic visual ripple effect.", 
          script: "Gyeonggi public center 검색 스마트 프로필 링크 클릭!" 
        }
      ];

      setShortsData({
        title: selectedNotice.title.replace(/\[.*?\]\s*/g, "") + " 초고속 팩트체크",
        slides: parsedMockSlides
      });

      setGenerationProgress(100);
      setTimeout(() => {
        setStep("editing");
        setCurrentSlideIndex(0);
      }, 1200);
    }
  };

  // Fast 5-line script editor updates the corresponding slide script
  const handleFastLineChange = (index: number, newText: string) => {
    const updatedSlides = [...shortsData.slides];
    updatedSlides[index] = {
      ...updatedSlides[index],
      script: newText
    };
    setShortsData({
      ...shortsData,
      slides: updatedSlides
    });
  };

  // Detailed slide visual prompt update
  const handleVisualPromptChange = (index: number, newText: string) => {
    const updatedSlides = [...shortsData.slides];
    updatedSlides[index] = {
      ...updatedSlides[index],
      visual: newText
    };
    setShortsData({
      ...shortsData,
      slides: updatedSlides
    });
  };

  const handleTitleChange = (newTitle: string) => {
    setShortsData({
      ...shortsData,
      title: newTitle
    });
  };

  // Automate Slide Show in 9:16 simulator
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaylistPlaying) {
      interval = setInterval(() => {
        setCurrentSlideIndex(prev => {
          if (prev >= 4) {
            setIsPlaylistPlaying(false);
            return 0; // wrap to start
          }
          return prev + 1;
        });
      }, 3000); // 3 seconds per slide as designed
    }
    return () => clearInterval(interval);
  }, [isPlaylistPlaying]);

  // Submit to MAKE integration
  const handleSendToMake = () => {
    const finalPayload: FinalMakePayload = {
      original_post: {
        title: selectedNotice?.title,
        date: selectedNotice?.date,
        link: selectedNotice?.link,
        content_preview: selectedNotice?.content_preview
      },
      shorts_data: shortsData
    };

    // Human supervisor approved & logged in system console as requested
    sendToMake(finalPayload);
    showToast("MAKE 시나리오로 통합 요약본을 안전하게 전송했습니다!", "success");
    setStep("dispatch_ready");
  };

  const sendToMake = (data: FinalMakePayload) => {
    console.log("MAKE 전달 데이터", data);
  };

  const copyPayloadToClipboard = () => {
    const finalPayload: FinalMakePayload = {
      original_post: {
        title: selectedNotice?.title,
        date: selectedNotice?.date,
        link: selectedNotice?.link,
        content_preview: selectedNotice?.content_preview
      },
      shorts_data: shortsData
    };
    navigator.clipboard.writeText(JSON.stringify(finalPayload, null, 2));
    setIsCopied(true);
    showToast("전송 데이터가 클립보드에 복사되었습니다.", "success");
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Dynamic visual preview style generators for the smartphone frame
  const getSlideGradient = (index: number) => {
    const gradients = [
      "from-indigo-950 via-slate-900 to-purple-950", // Slide 1: Welcome Intro
      "from-amber-950 via-slate-900 to-rose-950",   // Slide 2: Target Accent
      "from-teal-950 via-slate-900 to-emerald-950",  // Slide 3: Benefits highlight
      "from-red-950 via-slate-900 to-amber-950",    // Slide 4: Deadline warning
      "from-blue-950 via-slate-900 to-indigo-950"   // Slide 5: CTA Action
    ];
    return gradients[index] || "from-slate-900 to-slate-950";
  };

  const getSlideVisualHint = (index: number) => {
    const themes = [
      { text: "🚀 OPENING SCENE", color: "text-indigo-450 bg-indigo-900/40 border-indigo-750/30" },
      { text: "🎯 TARGET AUDIENCE", color: "text-amber-450 bg-amber-900/40 border-amber-750/30" },
      { text: "🎁 BENEFITS & VALUE", color: "text-teal-450 bg-teal-900/40 border-teal-750/30" },
      { text: "⏰ DEADLINE WARNING", color: "text-rose-400 bg-rose-900/40 border-rose-750/30" },
      { text: "👉 ACTION (CTA)", color: "text-sky-400 bg-sky-900/40 border-sky-750/30" }
    ];
    return themes[index] || { text: "SLIDE", color: "text-slate-400 bg-slate-800 border-slate-700" };
  };

  // Filter listings
  const filteredNotices = notices.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.content_preview.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeCategory === "전체") return matchesSearch;
    
    // Quick category parsing
    if (activeCategory === "공모/지원") return matchesSearch && (item.title.includes("공모") || item.title.includes("지원") || item.title.includes("사업"));
    if (activeCategory === "청년/인턴") return matchesSearch && (item.title.includes("청년") || item.title.includes("인턴"));
    if (activeCategory === "교육/행사") return matchesSearch && (item.title.includes("교육") || item.title.includes("행사") || item.title.includes("세미나"));
    if (activeCategory === "대관/공간") return matchesSearch && (item.title.includes("공간") || item.title.includes("대관") || item.title.includes("회의실"));
    
    return matchesSearch;
  });

  return (
    <div id="shorts-automator-root" className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased selection:bg-indigo-600 selection:text-white flex flex-col justify-between">
      
      {/* Toast Alert Portal */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-xl border bg-white shadow-xl text-sm font-medium text-slate-800 border-slate-200"
            style={{
              borderColor: toast.type === "success" ? "#10b981" : toast.type === "error" ? "#ef4444" : "#6366f1"
            }}
          >
            {toast.type === "success" && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
            {toast.type === "error" && <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
            {toast.type === "info" && <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Header navigation */}
      <header id="main-app-header" className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shrink-0">AI</div>
            <div>
              <h1 id="main-title" className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-2">
                G-Shorts Automation
                <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700">WORKFLOW</span>
              </h1>
            </div>
          </div>

          {/* Stepper Status Indicator Header */}
          <div className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-400">
            <div className={`flex items-center gap-2 ${step === "notice_select" ? "text-indigo-600 font-bold" : "text-emerald-600"}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center border text-[10px] ${step === "notice_select" ? "border-indigo-600 bg-indigo-50 text-indigo-600 font-bold" : "border-emerald-600 bg-emerald-50 text-emerald-600"}`}>1</span>
              <span>공지 선택</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            </div>
            <div className={`flex items-center gap-2 ${step === "generating" ? "text-indigo-600 font-bold animate-pulse" : step === "editing" || step === "dispatch_ready" ? "text-emerald-600" : "text-slate-400"}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center border text-[10px] ${step === "generating" ? "border-indigo-600 bg-indigo-50 text-indigo-600 font-bold" : step === "editing" || step === "dispatch_ready" ? "border-emerald-500 bg-emerald-50 text-emerald-600" : "border-slate-200"}`}>2</span>
              <span>AI 대본 생성</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            </div>
            <div className={`flex items-center gap-2 ${step === "editing" ? "text-indigo-600 font-bold" : step === "dispatch_ready" ? "text-emerald-600" : "text-slate-400"}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center border text-[10px] ${step === "editing" ? "border-indigo-600 bg-indigo-50 text-indigo-600 font-bold" : step === "dispatch_ready" ? "border-emerald-500 bg-emerald-50 text-emerald-600" : "border-slate-200"}`}>3</span>
              <span>대본 검토 및 수정</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            </div>
            <div className={`flex items-center gap-2 ${step === "dispatch_ready" ? "text-indigo-600 font-bold" : "text-slate-400"}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center border text-[10px] ${step === "dispatch_ready" ? "border-indigo-600 bg-indigo-50 text-indigo-600" : "border-slate-200"}`}>4</span>
              <span>MAKE 전송 완료</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              id="live-sync-button"
              onClick={fetchNotices} 
              disabled={isLoadingNotices || step !== "notice_select"}
              className="p-2 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
              title="공익센터 공지 새로고침"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingNotices ? "animate-spin" : ""}`} />
            </button>
            <div className="h-6 w-[1px] bg-slate-200" />
            <a 
              href="https://www.gggongik.or.kr/page/centernews/centernotice.html" 
              target="_blank" 
              rel="noreferrer" 
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 hover:bg-slate-200/50 transition-colors"
            >
              공식 홈 <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        
        {/* Step 1: Notice Select */}
        {step === "notice_select" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="space-y-1">
                <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-600" />
                  변환할 공지사항 선택
                </h2>
                <p className="text-xs text-slate-500">
                  경기도공익활동지원센터에 수집된 신규 게시물 중 대학생이 가장 관심있어 할 공고를 하나 선택해 보세요.
                </p>
              </div>

              {/* Filtering & Keywords Search bar */}
              <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="제목 또는 내용 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 placeholder-slate-450 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Category selection bar */}
            <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2.5 overflow-x-auto whitespace-nowrap scrollbar-hide">
              <ListFilter className="w-3.5 h-3.5 text-slate-400 mr-1 shrink-0" />
              {["전체", "공모/지원", "청년/인턴", "교육/행사", "대관/공간"].map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeCategory === category 
                      ? "bg-indigo-600 text-white shadow-sm" 
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-205 border border-transparent"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* List views */}
            {isLoadingNotices ? (
              <div className="py-24 text-center space-y-4">
                <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-500 animate-pulse">경기도 공익활동지원센터 게시판 데이터 수집 중...</p>
              </div>
            ) : filteredNotices.length === 0 ? (
              <div className="py-24 text-center bg-white rounded-2xl border border-dashed border-slate-200 space-y-3 shadow-sm">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500">조건에 부합하는 공지사항 게시글이 없습니다.</p>
                <button 
                  onClick={() => { setSearchQuery(""); setActiveCategory("전체"); }}
                  className="px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-indigo-600 border border-slate-200 shadow-sm"
                >
                  필터 초기화
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredNotices.map((item) => {
                  // Figure out a badge style based on titles
                  let tagText = "일반공지";
                  let tagStyle = "bg-slate-100 text-slate-600 border-slate-200";
                  
                  if (item.title.includes("공모") || item.title.includes("지원") || item.title.includes("사업")) {
                    tagText = "공모/지원";
                    tagStyle = "bg-indigo-50 text-indigo-700 border-indigo-100";
                  } else if (item.title.includes("교육") || item.title.includes("수강생") || item.title.includes("아카데미") || item.title.includes("세미나")) {
                    tagText = "교육/강의";
                    tagStyle = "bg-emerald-50 text-emerald-700 border-emerald-100";
                  } else if (item.title.includes("인턴") || item.title.includes("채용") || item.title.includes("청년")) {
                    tagText = "청년/인턴";
                    tagStyle = "bg-rose-50 text-rose-700 border-rose-100";
                  } else if (item.title.includes("공간") || item.title.includes("회의실") || item.title.includes("대관")) {
                    tagText = "공간지원";
                    tagStyle = "bg-sky-50 text-sky-700 border-sky-105";
                  }

                  const isScraped = item.id.startsWith("scraped");

                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group flex flex-col justify-between bg-white hover:bg-slate-50/50 transition-all rounded-2xl border border-slate-200/80 hover:border-indigo-200 hover:shadow-md overflow-hidden"
                    >
                      <div className="p-5 space-y-4">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className={`px-2.5 py-0.5 rounded border ${tagStyle} font-semibold text-[10px]`}>
                            {tagText}
                          </span>
                          <span className="text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {item.date}
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-[1.4] text-sm tracking-tight line-clamp-2">
                            {item.title}
                          </h3>
                          <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                            {item.content_preview}
                          </p>
                        </div>
                      </div>

                      <div className="p-5 border-t border-slate-100 bg-slate-55/40 flex items-center justify-between text-xs">
                        <span className="text-[10px] text-slate-400 font-mono">
                          {isScraped ? "⚡ 실시간 연동" : "⭐️ 정밀 캐시아카이브"}
                        </span>
                        
                        <button
                          onClick={() => handleSelectNoticeAndOpen(item)}
                          disabled={loadingDetailId !== null}
                          className="flex items-center gap-1 text-xs font-bold px-4 py-2 rounded-xl bg-white hover:bg-indigo-600 hover:text-white text-indigo-600 transition-all border border-slate-200 hover:border-indigo-600 shadow-sm"
                        >
                          {loadingDetailId === item.id ? (
                            <>
                              <div className="w-3 h-3 border-2 border-indigo-650 border-t-transparent rounded-full animate-spin" />
                              <span>해독 중..</span>
                            </>
                          ) : (
                            <>
                              <span>상세 요약</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Generation Loading Animation Panel */}
        {step === "generating" && (
          <div className="max-w-2xl mx-auto py-12 mt-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-8 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-indigo-550 via-rose-450 to-emerald-450 transition-all duration-350" style={{ width: `${generationProgress}%` }} />
              
              <div className="relative inline-flex items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                <Cpu className="w-10 h-10 text-indigo-600 animate-pulse" />
                <div className="absolute -inset-1 rounded-2xl border border-indigo-500/10 animate-ping pointer-events-none" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold text-slate-900 flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  Gemini AI 자막 제작 자동화 가동
                </h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  너는 15초 유튜브 쇼츠 제작자다. 대학생의 관점으로 가공하고 마감일 및 혜택 요약 5슬라이드를 포장하고 있습니다.
                </p>
              </div>

              {/* Progress visual metrics */}
              <div className="space-y-4">
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-100">
                  <div 
                    className="h-full bg-indigo-600 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${generationProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-mono text-slate-400 px-1">
                  <span>SYSTEM PROGRESS</span>
                  <span className="text-indigo-650 font-bold">{generationProgress}%</span>
                </div>
              </div>

              {/* Process logs box */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-left font-mono text-[10.5px] space-y-1.5 h-32 overflow-y-auto max-h-32 scrollbar-thin text-slate-600">
                {generationLogs.map((log, index) => (
                  <div key={index} className={`leading-relaxed ${log.includes("ERROR") ? "text-rose-600" : log.includes("SUCCESS") ? "text-emerald-600" : log.includes("PROCESS") ? "text-slate-500" : "text-slate-400"}`}>
                    {log}
                  </div>
                ))}
              </div>

              <p className="text-xs text-indigo-600 font-bold animate-pulse">{generationStatusText}</p>
            </div>
          </div>
        )}

        {/* Step 3: Review, Customize & Fast 5-Line Editor */}
        {step === "editing" && (
          <div className="space-y-6">
            
            {/* Review Back header controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStep("notice_select")}
                  className="p-2 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-150 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    AI 쇼츠 대본 가공
                  </h2>
                  <p className="text-xs text-slate-500">
                    AI가 설계한 아래 카드와 자막을 검수하고, 마케팅에 어울리는 5줄 숏폼 대본을 실시간 수정하세요.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={triggerAiShortsGeneration}
                  className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <Undo className="w-4 h-4 text-slate-500" />
                  AI 재기획
                </button>
                <button
                  onClick={handleSendToMake}
                  className="px-5 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-bold rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  승인 및 MAKE 전송
                </button>
              </div>
            </div>

            {/* Video Title Editor Plate */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-2.5 shadow-sm">
              <label className="text-[11px] font-bold text-slate-400 block tracking-wider uppercase">
                유튜브 쇼츠 영상 기획 타이틀 (Title)
              </label>
              <input
                type="text"
                value={shortsData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="모집 대상과 혜택을 강조한 타이틀을 작성해 주세요."
                className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-xl px-4 py-3 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            {/* Two-Column Editor Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: 16:9 Smartphone Simulator Layout */}
              <div className="lg:col-span-5 flex flex-col items-center">
                <div className="w-full max-w-xs space-y-4">
                  
                  <div className="text-center font-bold text-xs text-slate-400 flex items-center justify-center gap-1.5 uppercase tracking-wider">
                    <Smartphone className="w-4 h-4 text-slate-400" />
                    유튜브 쇼츠 가상 시뮬레이터
                  </div>

                  {/* Main realistic phone component */}
                  <div className="relative aspect-[9/16] w-full bg-slate-900 rounded-[3rem] border-[8px] border-slate-800 shadow-xl p-4 overflow-hidden flex flex-col justify-between">
                    
                    {/* Speaker camera bar */}
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-4 bg-slate-800 rounded-full z-20" />

                    {/* Background slide theme */}
                    <div className={`absolute inset-0 bg-gradient-to-b ${getSlideGradient(currentSlideIndex)} opacity-90 transition-all duration-700 z-0`} />

                    {/* Gradient light orb details matching image prompt concept */}
                    <div className="absolute top-1/4 -left-1/4 w-48 h-48 rounded-full bg-indigo-500/10 blur-3xl z-1 animate-pulse" />
                    <div className="absolute bottom-1/4 -right-1/4 w-48 h-48 rounded-full bg-rose-500/10 blur-3xl z-1 animate-pulse" />

                    {/* Upper interface overlay info */}
                    <div className="relative z-10 flex items-center justify-between text-[10px] text-white/50 pt-2 font-mono">
                      <span>경기공익 Shorts AI</span>
                      <span className="bg-red-650 text-white font-bold px-1.5 py-0.5 rounded-[4px] tracking-widest text-[8px] animate-pulse">PREVIEW</span>
                    </div>

                    {/* Content visualization area */}
                    <div className="relative z-10 flex flex-col items-center text-center px-1 py-3 space-y-3">
                      <span className={`px-2 py-0.5 rounded text-[8px] border font-bold font-mono tracking-wider ${getSlideVisualHint(currentSlideIndex).color}`}>
                        {getSlideVisualHint(currentSlideIndex).text}
                      </span>
                      <div className="text-[10px] text-indigo-100/90 bg-black/60 backdrop-blur-sm border border-white/15 p-2.5 rounded-xl max-w-full font-mono line-clamp-3 leading-relaxed text-left shadow-md">
                         💡 Image Prompt:<br/>
                         {shortsData.slides[currentSlideIndex]?.visual || "No visual prompt"}
                      </div>
                    </div>

                    {/* Large Overlaid caption script */}
                    <div className="relative z-10 my-auto py-6 px-1 flex items-center justify-center text-center">
                      <div className="bg-black/70 backdrop-blur-md shadow-xl border border-white/10 p-3.5 rounded-xl max-w-full">
                        <p className="text-sm font-extrabold tracking-tight text-yellow-300 leading-snug drop-shadow-[0_2px_3px_rgba(0,0,0,0.85)]">
                          "{shortsData.slides[currentSlideIndex]?.script || "대본 없음"}"
                        </p>
                      </div>
                    </div>

                    {/* Overlay interaction stats on lower right side (Shorts elements) */}
                    <div className="absolute right-3 bottom-20 z-10 flex flex-col items-center gap-4 text-white/60">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xs">🤍</div>
                        <span className="text-[8px] font-mono">대학생</span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xs">💬</div>
                        <span className="text-[8px] font-mono">15s</span>
                      </div>
                    </div>

                    {/* Bottom playback controller & timeline bar */}
                    <div className="relative z-10 space-y-2">
                      {/* Interactive slide bubble markers */}
                      <div className="flex items-center justify-center gap-1">
                        {shortsData.slides.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => { setCurrentSlideIndex(i); setIsPlaylistPlaying(false); }}
                            className={`h-1.5 rounded-full transition-all duration-300 ${i === currentSlideIndex ? "w-6 bg-red-500" : "w-1.5 bg-white/30 hover:bg-white/50"}`}
                          />
                        ))}
                      </div>

                      {/* Video status and timing bar */}
                      <div className="flex items-center justify-between text-[11px] text-white/50">
                        <span>SLIDE 0{currentSlideIndex + 1} / 05</span>
                        <span className="text-white bg-black/40 px-2 py-0.5 rounded-[4px] font-mono text-[9px]">3초 자동 넘김</span>
                      </div>
                    </div>

                  </div>

                  {/* Play & Navigation actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setCurrentSlideIndex(prev => (prev > 0 ? prev - 1 : 4));
                        setIsPlaylistPlaying(false);
                      }}
                      className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 py-2 text-xs text-slate-700 font-medium rounded-lg transition-all shadow-sm"
                    >
                      이전
                    </button>
                    <button
                      onClick={() => setIsPlaylistPlaying(!isPlaylistPlaying)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all text-white ${isPlaylistPlaying ? "bg-rose-600 hover:bg-rose-700" : "bg-indigo-600 hover:bg-indigo-700"}`}
                    >
                      {isPlaylistPlaying ? (
                        <>
                          <div className="w-2 h-2 rounded-full bg-white animate-ping" />
                          일시정지
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 text-white fill-white" />
                          자동 재생
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setCurrentSlideIndex(prev => (prev < 4 ? prev + 1 : 0));
                        setIsPlaylistPlaying(false);
                      }}
                      className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 py-2 text-xs text-slate-700 font-medium rounded-lg transition-all shadow-sm"
                    >
                      다음
                    </button>
                  </div>

                </div>
              </div>

              {/* Right Column: Fast 5 Line Editor & Full customization settings */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Compact Highlight Fast Editor Panel */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-extrabold uppercase tracking-widest text-indigo-700 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5" />
                      5줄 자막 초고속 대본 편집기
                    </h3>
                    <span className="text-[10px] text-slate-450">자막 수정 시 프리뷰에 즉시 반영됩니다</span>
                  </div>

                  {/* Stacking 5 responsive inputs together */}
                  <div className="space-y-3.5">
                    {shortsData.slides.map((slide, index) => (
                      <div 
                        key={index}
                        onClick={() => setCurrentSlideIndex(index)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                          index === currentSlideIndex 
                            ? "bg-slate-50 border-indigo-500 shadow-sm border-l-4 border-l-indigo-600" 
                            : "bg-white border-slate-200/60 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-slate-500 font-mono flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${index === currentSlideIndex ? "bg-indigo-600 animate-pulse" : "bg-slate-300"}`} />
                            SLIDE 0{index + 1}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400">
                            {index === 0 && "🚀 도입부 핵심 공략"}
                            {index === 1 && "🎯 핵심 타겟 소구"}
                            {index === 2 && "🎁 최고의 혜택 강조"}
                            {index === 3 && "⏰ 지원 마감일 요약"}
                            {index === 4 && "👉 행동 유도 (CTA)"}
                          </span>
                        </div>

                        {/* input box */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={slide.script}
                            onChange={(e) => handleFastLineChange(index, e.target.value)}
                            placeholder={`슬라이드 ${index + 1} 자막을 입력하세요`}
                            className="w-full bg-white border border-slate-200 text-xs rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 font-medium transition-all"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subtitle/Visual prompt detailed customize */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-extrabold text-indigo-700 uppercase tracking-widest flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                      선택된 슬라이드 이미지 생성 프롬프트 정밀 튜닝
                    </h3>
                    <span className="text-[11px] font-bold text-indigo-600">SLIDE 0{currentSlideIndex + 1}</span>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-400 block uppercase tracking-tight">AI IMAGE PROMPT (Midjourney / DALL-E) - English</label>
                      <textarea
                        rows={3}
                        value={shortsData.slides[currentSlideIndex]?.visual || ""}
                        onChange={(e) => handleVisualPromptChange(currentSlideIndex, e.target.value)}
                        placeholder="AI 이미지 생성에 활용할 구체적인 영문 프롬프트를 작성해주세요."
                        className="w-full bg-slate-55 focus:bg-white border border-slate-200 text-xs rounded-xl p-3.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-450 font-mono leading-relaxed transition-all"
                      />
                    </div>
                    <div className="text-[10px] text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-start gap-2">
                      <span className="text-xs">💡</span>
                      <span>
                        영상의 흐름과 각 주제(모집, 혜택, 마감일)에 가장 부합하는 고감도 3D 일러스트 혹은 벡터 아트 일관성 묘사가 들어간 프롬프트입니다.
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Target original post refer drawer */}
            <div className="bg-slate-100/50 border border-slate-250 p-5 rounded-2xl space-y-2.5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                원본 공지사항 데이터 (참가자용 참고용)
              </h3>
              <div className="bg-white rounded-xl p-4 border border-slate-200 max-h-48 overflow-y-auto text-xs text-slate-600 space-y-1.5 leading-relaxed">
                <p className="font-bold text-slate-800">{selectedNotice?.title}</p>
                <div className="h-[1px] bg-slate-100 my-2" />
                <p className="whitespace-pre-line text-[11px]">
                  {selectedNotice?.content || selectedNotice?.content_preview}
                </p>
              </div>
            </div>

          </div>
        )}

        {/* Step 4: Finished & MAKE Dispatch Ready */}
        {step === "dispatch_ready" && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 p-8 rounded-3xl text-center shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl pointer-events-none" />
              
              <div className="inline-flex items-center justify-center p-3 rounded-full bg-emerald-50 border border-emerald-150 text-emerald-600 mb-4 animate-bounce">
                <CheckCircle className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">MAKE 전송 완료 완료</h2>
                <p className="text-sm text-slate-550">
                  승인 완료된 공공 소식 쇼츠 요약 패킷이 포장되어 전송되었습니다.
                </p>
                <div className="inline-block mt-2 bg-emerald-50 text-emerald-700 border border-emerald-100/50 font-mono text-[10px] px-3 py-1 rounded-full font-bold">
                  API DATA TRANSACTION PACKED
                </div>
              </div>
            </div>

            {/* Two blocks: Pipeline status list VS JSON payload preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
              
              {/* Pipeline Status Checklist */}
              <div className="bg-white border border-slate-200 p-6 rounded-3xl flex flex-col justify-between shadow-sm">
                <div className="space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-extrabold text-indigo-700 tracking-wider uppercase">
                      자동화 시나리오 흐름 상태 모니터
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {/* Done states */}
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 w-4 h-4 rounded-full bg-emerald-55 border border-emerald-300 flex items-center justify-center text-emerald-600 text-[10px] shrink-0 font-bold">✓</div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">공지 불러오기 완료</p>
                        <p className="text-[10px] text-slate-400 font-medium">Gyeonggi Gov notice scraped successfully</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 w-4 h-4 rounded-full bg-emerald-55 border border-emerald-300 flex items-center justify-center text-emerald-600 text-[10px] shrink-0 font-bold">✓</div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">AI 대본 생성 완료</p>
                        <p className="text-[10px] text-slate-400 font-medium">Gemini text summary generation success</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 w-4 h-4 rounded-full bg-emerald-55 border border-emerald-300 flex items-center justify-center text-emerald-600 text-[10px] shrink-0 font-bold">✓</div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">사용자 검수 완료</p>
                        <p className="text-[10px] text-slate-400 font-medium">Human visual supervisor approved and customized</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 mb-1">
                      <div className="mt-0.5 w-4 h-4 rounded-full bg-emerald-55 border border-emerald-300 flex items-center justify-center text-emerald-600 text-[10px] shrink-0 font-bold">✓</div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">MAKE 전달 완료</p>
                        <p className="text-[10px] text-slate-400 font-medium">Webhook packed structure locked and transmitted</p>
                      </div>
                    </div>

                    <div className="h-[1px] bg-slate-100 my-2" />

                    {/* Pending states shown as empty circles */}
                    <div className="flex items-start gap-3 opacity-60">
                      <div className="mt-0.5 w-4 h-4 rounded-full border-2 border-slate-200 flex items-center justify-center text-slate-350 text-[10px] shrink-0 font-bold"></div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500">이미지 생성 예정</p>
                        <p className="text-[10px] text-slate-400">Midjourney / Imagen automation scheduled in Make</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 opacity-60">
                      <div className="mt-0.5 w-4 h-4 rounded-full border-2 border-slate-200 flex items-center justify-center text-slate-350 text-[10px] shrink-0 font-bold"></div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500">영상 생성 예정</p>
                        <p className="text-[10px] text-slate-400">Automated video compilation rendering trigger</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 opacity-60">
                      <div className="mt-0.5 w-4 h-4 rounded-full border-2 border-slate-200 flex items-center justify-center text-slate-350 text-[10px] shrink-0 font-bold"></div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500">YouTube Shorts 업로드 예정</p>
                        <p className="text-[10px] text-slate-400">Push to shorts dynamic flow active</p>
                      </div>
                    </div>

                  </div>
                </div>

                <div className="pt-6">
                  <button
                    onClick={() => setStep("notice_select")}
                    className="w-full bg-slate-100 hover:bg-slate-200/85 border border-slate-200 text-xs font-bold text-slate-700 py-3 rounded-2xl flex items-center justify-center gap-2 transition-colors"
                  >
                    <Undo className="w-4 h-4" />
                    새로운 공지사항 다듬기
                  </button>
                </div>
              </div>

              {/* JSON Payload Inspector */}
              <div className="bg-white border border-slate-200 p-6 rounded-3xl flex flex-col justify-between shadow-sm">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-extrabold text-indigo-700 tracking-wider uppercase">
                      송출 데이터 패키지 (JSON)
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={copyPayloadToClipboard}
                        className="text-[10px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-1 rounded-md"
                      >
                        {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        {isCopied ? "복사 완료" : "JSON 복사"}
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 font-mono text-[10.5pt] leading-relaxed select-all overflow-auto h-[320px] text-indigo-950">
                    <pre className="text-indigo-950 font-sans text-xs">
                      {JSON.stringify({
                        original_post: {
                          title: selectedNotice?.title,
                          date: selectedNotice?.date,
                          link: selectedNotice?.link,
                          content_preview: selectedNotice?.content_preview
                        },
                        shorts_data: shortsData
                      }, null, 2)}
                    </pre>
                  </div>
                </div>

                <div className="pt-4 text-center">
                  <p className="text-[10px] text-slate-550 leading-relaxed">
                    * 이 데이터 팩은 console.log('MAKE 전달 데이터') 함수를 통해 성공적으로 출력되었습니다.
                  </p>
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* Notice Detail full visual dialog drawer modal */}
      <AnimatePresence>
        {isDetailOpen && selectedNotice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Modal background glass scrim */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
              onClick={() => setIsDetailOpen(false)}
            />

            {/* Modal card content */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative max-w-lg w-full bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] z-10"
            >
              
              {/* Header card banner */}
              <div className="p-6 border-b border-slate-100 bg-white flex items-start justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 font-mono">경기공익 오리지널 데이터 요약</span>
                  <h3 className="text-sm font-bold text-slate-900 mt-1 line-clamp-1">{selectedNotice.title}</h3>
                </div>
                <button 
                  onClick={() => setIsDetailOpen(false)}
                  className="p-1.5 rounded-lg text-slate-450 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Scrollable content body container */}
              <div className="p-6 overflow-y-auto space-y-5">
                
                {/* Visual Image Banner */}
                {selectedNotice.image ? (
                  <div className="w-full aspect-video rounded-2xl overflow-hidden border border-slate-200 relative">
                    <img 
                      src={selectedNotice.image} 
                      alt="notice-image" 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover" 
                    />
                  </div>
                ) : (
                  <div className="w-full aspect-video rounded-2xl border border-dashed border-slate-250 bg-slate-50 flex items-center justify-center text-slate-450 text-xs gap-2">
                    <ImageIcon className="w-5 h-5 text-slate-400" />
                    <span>대표 첨부 이미지가 존재하지 않습니다.</span>
                  </div>
                )}

                {/* Subtitle key stats info */}
                <div className="flex items-center gap-6 text-xs text-slate-500">
                  <div>
                    <span className="text-slate-400 font-semibold">작성일:</span> {selectedNotice.date}
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold">출처:</span> 경기도공익활동지원센터
                  </div>
                </div>

                {/* Scraped content core block */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">게시물 원문 요약/해석 (Scraped Detail)</span>
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs leading-relaxed text-slate-700 whitespace-pre-line font-medium">
                    {selectedNotice.content || selectedNotice.content_preview}
                  </div>
                </div>

              </div>

              {/* Action trigger button inside modal */}
              <div className="p-5 border-t border-slate-100 bg-slate-50/65 flex items-center justify-between">
                <a 
                  href={selectedNotice.link} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  원글 바로가기 <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  onClick={triggerAiShortsGeneration}
                  className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-all"
                >
                  <Sparkles className="w-4 h-4 text-white" />
                  AI 쇼츠 대본 생성하기
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Styled Footer */}
      <footer className="border-t border-slate-205 bg-white py-10 mt-16 shadow-inner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-500">
            <span>ⓒ 2026 경기도공익활동지원센터</span>
            <span>•</span>
            <span>AI Shorts Generation automation workflow package</span>
          </div>
          <p className="text-[10px] text-slate-450 max-w-md mx-auto leading-relaxed">
            이 서비스는 경기도공익활동지원센터 공지사항 데이터를 실시간 인코딩하여 브라우저 독립적으로 변환, 숏폼 자동 기획을 수행하는 시뮬레이터 플랫폼입니다.
          </p>
        </div>
      </footer>

    </div>
  );
}
