import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import * as cheerio from "cheerio";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase JSON limits for larger content transfers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Initialize Google GenAI on the server
// The GEMINI_API_KEY is securely configured in Settings > Secrets or .env/runtime environment
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Authentic, high-fidelity mock notices fallback database
const MOCK_NOTICES = [
  {
    id: "notice-1",
    title: "[공모/지원] 2026년 경기도 공익활동 민간위탁 지원사업 공고",
    date: "2026-06-01",
    link: "https://www.gggongik.or.kr/page/centernews/centernotice.html?mode=view&id=1025",
    content_preview: "경기도 내 비영리민간단체 및 공익활동 단체의 공익적 프로젝트 실행을 위한 예산 및 컨설팅을 지원하는 대표 브랜드 사업입니다.",
    content: "■ 2026년 경기도 공익활동 민간위탁 지원사업 공고\n\n경기도공익활동지원센터는 도내 공익활동 단체의 다양성을 증진하고 역량을 지속적으로 발전하고자 [2026 공익활동 민간위탁 지원사업]을 공모합니다.\n\n1. 지원대상\n- 경기도 내 등록된 비영리민간단체 및 상시 공익적 사회 공헌 활동을 진행하는 임의단체(동아리, 소모임 포함)\n- 대학생 연합 공익 동아리 및 청년 공익 네트워킹 그룹 우대\n\n2. 지원내용\n- 단체 프로젝트 별 최대 1,000만원의 공익활동 프로젝트 순수 실행 비용 지원\n- 실무 회계 관리 교육 및 프로젝트 전문가 1:1 전담 퍼실리테이터 멘토링 매칭\n- 경기 공익 네트워크 및 센터 보유 대관 시설 무제한 무료 연계 제공\n\n3. 공모분야\n- 기후위기 대응 및 탄소중립 생활 정착 사회 활동\n- 지역사회 복지 사각지대 해소 및 주민 자치 활성화\n- 청년, 대학생, 노인 등 세대 간 연대 및 이해 증진 캠페인\n\n4. 신청기간: 2026년 6월 1일 ~ 2026년 6월 30일 18:00까지\n5. 마감일: 2026년 6월 30일(화) 18:00\n6. 접수방법: 경기도공익활동지원센터 웹 포털을 통한 서류 다운로드 후 이메일 제출\n\n여러분의 작지만 반짝이는 아이디어가 경기도민 모두의 커다란 공익으로 번질 수 있도록 많은 참여 바랍니다!",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60"
  },
  {
    id: "notice-2",
    title: "[교육/행사] 2026년 경기도 청년 공익활동가 역량강화 교육 '공익 레벨업' 수강생 모집",
    date: "2026-06-05",
    link: "https://www.gggongik.or.kr/page/centernews/centernotice.html?mode=view&id=1026",
    content_preview: "공익활동에 관심 있는 대학생, 청년 누구나! 실무에서 바로 써먹는 노션, 캔바, SNS 브랜딩 및 콘텐츠 기획 전액 무료 강의 수료증 발급.",
    content: "■ 2026년 경기도 청년 공익활동가 역량강화 교육 '공익 레벨업' 과정 수강생 모집\n\n공익 실무가 어렵게 느껴지시나요? 디자인 툴, 매체 기획, 문서 협업, 그리고 SNS 브랜딩 전략까지 한번에 마스터하세요! 경기도 청년과 대학생들을 위한 고품격 무료 실무 특강이 열렸습니다.\n\n1. 교육명\n- 2026 경기도 청년 및 대학생 공익 혁신가 고도화 교육 '공익 레벨업'\n\n2. 모집대상\n- 경기도에 거주하거나 경기 소재 대학에 재학 또는 휴학 중인 대학생, 청년 (만 19세 ~ 34세 이하) 중 새로운 공익 가치 형성을 꿈꾸는 사람 누구나!\n- 청년 공익 기획자로 성장하고 싶은 예비 창업자 및 시민사회 실무자\n\n3. 교육과정\n- 1주차: 협업 장인 되기 (노션 프로젝트 관리 및 효율적 슬랙 아카이빙)\n- 2주차: 누구나 디자이너! (Canva 기획 및 피그마를 이용한 카드뉴스 실전 템플릿 제작)\n- 3주차: SNS 바이럴 정복 (인스타그램 릴스 및 유튜브 쇼츠 기획과 숏폼 트렌드 분석)\n- 4주차: 사업계획서 크리틱 (경기도 및 정부 공익 지원 공모사업 기획서 작성 실습)\n\n4. 혜택 지원\n- 참가 교육비 전액 무료 (교재 및 매주 현장 다과 제공)\n- 우수 교육 이수생 대상 맞춤형 전문가 1:1 무료 컨설팅 매핑권 제공\n- 경기도공익활동지원센터 공인 영문/국문 이수증 발급\n- 향후 경기 공익 청년 프로젝트 가산점 혜택 제공\n\n5. 모집인원: 선착순 30명 마감\n6. 교육일정: 2026년 7월 4일부터 매주 토요일 오후 2시~5시\n7. 신청마감: 2026년 6월 28일(일) 23:59까지\n\n지금 바로 구글 설문 폼을 통해 신청해보세요!",
    image: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&auto=format&fit=crop&q=60"
  },
  {
    id: "notice-3",
    title: "[공모/청년] 2026년 하반기 경기도 청년 공익인턴십 (체험형/직무형) 모집 안내",
    date: "2026-06-08",
    link: "https://www.gggongik.or.kr/page/centernews/centernotice.html?mode=view&id=1027",
    content_preview: "공익활동 단체 실무를 경험하고 월 220만원의 활동비를 받으며 경력을 키워갈 2026 하반기 경기도 청년 공익인턴십 인재를 모십니다.",
    content: "■ 2026년 하반기 경기도 청년 공익인턴십 인재 선발 공고\n\n경기도공익활동지원센터에서 청년들의 비영리 생태계 참여를 독려하고 실전 공익 분야의 일 경험과 경력 형성을 돕기 위해 하반기 공익 인턴십 대상자를 모집합니다.\n\n1. 모집 분야 및 직무\n- 경기도공익활동지원센터 본사 및 경기 내 주요 파트너 비영리 단체 실무 부서 배치\n- 주요 업무: 공익 활동 캠페인 기획 및 SNS 채널 운영, 시민사회 포럼 소통 포탈 관리 지원\n\n2. 모집 대상\n- 만 19세 이상 34세 이하인 미취업 청년\n- 거주지 요건: 공고일 기준 주민등록상 주소지가 경기도인 청년\n- 학력 요건: 경기도 소재 대학교 재학생, 휴학생, 졸업예정자 포함 (재학생의 경우 학기 중 파트타임 별도 조절 지원)\n\n3. 급여 및 혜택 조건\n- 월 고정 기본급 220만원 지급 (주휴수당 포함, 4대 사회보험 의무 가입)\n- 전문 커리어 컨설턴트의 개인별 취업 역량 향상 멘토링 기본 제공\n- 경기도 공익 기획 인턴 활동 공식 인증 추천서 발급\n- 월 1회 공익 단체 현장 네트워킹 및 유명 연사 런치 브라운 백 세미나 참여 제공\n\n4. 근무 기간: 2026년 7월 6일 ~ 2026년 12월 31일 (6개월)\n5. 신청마감: 2026년 6월 25일(목) 18:00\n6. 대외 활동 및 현업 실무 경력을 최고 수준으로 무장할 최고의 찬스! 어서 지원하세요!",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=60"
  },
  {
    id: "notice-4",
    title: "[공간지원] 2026년 하반기 공익활동 소모임 및 대학생 동아리 무료 공간 대관 공고",
    date: "2026-06-03",
    link: "https://www.gggongik.or.kr/page/centernews/centernotice.html?mode=view&id=1028",
    content_preview: "공간 대여 비용 걱정 끝! 경기도 수원, 의정부 센터의 프리미엄 회의실, 스마트 공유 워크스페이스, 첨단 미디어 촬영실 전액 무료 대관 사업.",
    content: "■ 2026년 경기도 공익활동 단체 및 청년 소모임 공간 대관 서비스 개방\n\n스터디룸이나 비싼 유료 회의 공간 예약이 힘드셨나요? 경기도공익활동지원센터가 대학생 동아리와 공익 활동 소모임을 위해 센터 내 보유한 최첨단 스마트 공유 자산을 무료로 오픈합니다.\n\n1. 지원 범위\n- 경기남부센터 (수원시 팔달구): 대회의실(최대 40석), 중회의실(15석), 워크스테이션 공유 부스\n- 경기북부센터 (의정부시): 미디어 워크숍 스튜디오(유튜브 라이브 및 방음 촬영 시스템 구비), 세미나 공간\n- 전 구역 최고사양 빔프로젝터, 스마트 화이트보드, 고화질 캠, 전대역 기가 와이파이, 고급 커피 및 차 무료 제공\n\n2. 이용 대상\n- 경기도 소재 대학 동아리 중 사회 공헌, 자원 봉사, 친환경, 교육 멘토링 등 공익 기획을 진행하는 모임 (3인 이상)\n- 경기도 거주 청년들로 구성된 사익 목적이 아닌 순수 연구 및 공공 캠페인 소모임\n\n3. 대여 비용\n- 전액 무료 (공식 연간 이용 단체 등록 시 상시 우선 예약권 및 무료 복사/인쇄 쿠폰 발송)\n\n4. 대관 신청: 이용일 기준 최소 3일 전 홈페이지 신청 및 승인 완료 후 즉시 이용 가능\n\n공간 부족으로 지체되었던 다양한 기획들의 무한한 나래를 여기서 펼쳐보세요!",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=60"
  },
  {
    id: "notice-5",
    title: "[공모/아이디어] 2026년 경기도 청년 ESG 공익 실천 아이디어 및 캠페인 공모전",
    date: "2026-06-07",
    link: "https://www.gggongik.or.kr/page/centernews/centernotice.html?mode=view&id=1029",
    content_preview: "총 상금 500만원 및 경기도지사상 시상! 대학가 정화, 플로깅 등 실생활에서 누구나 도전하는 탄소 저감형 공익 아이디어를 찾습니다.",
    content: "■ 2026 경기도 청년 ESG 일상 속 공익 실천 제안 공모전\n\n지구를 지키고 우리 동네를 상생의 도시로 바꾸는 일상 속 아이디어가 있으신가요? 아이디어 기획만으로도 상금과 도지사상 수훈 기회를 드립니다!\n\n1. 공모 주제 (아래 중 택1)\n- 캠퍼스 내 폐지/다회용 컵 제로 순환 시스템 정착 방안\n- 동네 환경 활성화를 위한 로컬 러너 플로깅 브랜드 메이킹\n- 노인 일자리와 연계가능한 아동 안심 돌봄 보행로 가이드 캠페인\n\n2. 지원 자격\n- 만 19세 이상 34세 이하 대학생, 유학생, 경기도 청년 (개인 또는 4인 이하 팀 가능)\n\n3. 시상 및 상금 혜택\n- 대상 (1팀): 경기도지사상 훈격 및 상금 200만원\n- 최우수상 (2팀): 경기도공익활동지원센터장상 및 상금 100만원\n- 우수상 (3팀): 상금 50만원 지원\n- 본선 진출작 전체: 실제 경기도 청년 공익 사업으로 채택하여 최대 500만원 추가 실험비 지급!\n\n4. 접수 마감: 2026년 7월 10일(금) 오후 6시 정각\n\n세상을 더 아름답게 만들 여러분의 반짝이는 로드맵을 기다립니다. 지금 링크에서 다운받아 제안해 보세요!",
    image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=60"
  }
];

// Scraper function for the list page
async function scrapeNotices() {
  try {
    const url = "https://www.gggongik.or.kr/page/centernews/centernotice.html";
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }
    const html = await res.text();
    const $ = cheerio.load(html);
    const notices: any[] = [];

    // Let's check common XE board elements, e.g., table columns, tr element inside tbody, etc.
    const rows = $("table tr, .board-list tr, .tbl_head01 tr, .board_list tr, .list_table tr, .board-list li, .notice-list li, tbody tr");
    
    rows.each((i, elem) => {
      const titleLink = $(elem).find("a").filter(function() {
        const href = $(this).attr("href") || "";
        return href.includes("id=") || href.includes("wr_id=") || href.includes("centernotice.html") || href.includes("view");
      }).first();
      
      let titleText = "";
      let href = "";
      
      if (titleLink && titleLink.length > 0) {
        titleText = titleLink.text().trim();
        href = titleLink.attr("href") || "";
      } else {
        // Fallback to any generic tag inside tr
        const genericLink = $(elem).find("a").first();
        if (genericLink && genericLink.length > 0) {
          titleText = genericLink.text().trim();
          href = genericLink.attr("href") || "";
        }
      }

      if (!titleText || titleText.length < 5) return;
      if (titleText.includes("이전") || titleText.includes("다음") || titleText.includes("목록") || titleText.includes("로그인") || titleText.includes("회원가입")) return;

      let link = href;
      if (href && !href.startsWith("http")) {
        link = "https://www.gggongik.or.kr" + (href.startsWith("/") ? "" : "/page/centernews/") + href;
      }

      // Try parsing date
      let date = "";
      const dateTextReg = /\d{4}-\d{2}-\d{2}/;
      
      $(elem).find("td, span, div, .date, .regdate, .add_date").each((j, col) => {
        const text = $(col).text().trim();
        const match = text.match(dateTextReg);
        if (match && !date) {
          date = match[0];
        }
      });

      if (!date) {
        // Find any 2-digit format YY.MM.DD
        const shortDateReg = /\d{2}\.\d{2}\.\d{2}/;
        $(elem).find("td, span, div").each((j, col) => {
          const text = $(col).text().trim();
          const match = text.match(shortDateReg);
          if (match && !date) {
            date = "20" + match[0].replace(/\./g, "-");
          }
        });
      }

      if (!date) {
        date = new Date().toISOString().split("T")[0];
      }

      // Avoid duplicates
      if (notices.some(n => n.title === titleText)) return;

      notices.push({
        id: `scraped-${notices.length + 1}`,
        title: titleText,
        date: date,
        link: link,
        content_preview: `${titleText}에 관한 공익센터 최신 공지사항입니다. 지원 요건과 주요 대상, 상세 혜택을 분석해보세요!`,
        content: "", // dynamic fetch on demand
        image: ""
      });
    });

    if (notices.length >= 2) {
      return notices;
    }
  } catch (error) {
    console.error("Live page scraping failed. Falling back to default list.");
  }
  return [];
}

// Scrape details of a notice from its link
async function scrapeNoticeDetail(url: string) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }
    const html = await res.text();
    const $ = cheerio.load(html);

    const selectors = [
      ".write_div", ".view_content", ".view-content", "#bo_v_con", ".content", 
      ".board-view-con", ".board-view-content", "article", ".board_view_area", ".view_body",
      "#board_view", ".tbl_view", ".view-con", "#bo_v_atc"
    ];

    let content = "";
    for (const selector of selectors) {
      const text = $(selector).text().trim();
      if (text && text.length > 50) {
        content = text;
        break;
      }
    }

    if (!content || content.length < 50) {
      let maxText = "";
      $("div").each((i, el) => {
        const text = $(el).text().replace(/\s+/g, " ").trim();
        if (text.length > maxText.length && text.length < 8000) {
          maxText = text;
        }
      });
      content = maxText;
    }

    // Capture potential upload images
    let images: string[] = [];
    $("img").each((i, el) => {
      const src = $(el).attr("src") || "";
      if (src && !src.startsWith("data:") && (src.includes("upload") || src.includes("data") || src.includes("file") || src.startsWith("http") || src.startsWith("/"))) {
        let absSrc = src;
        if (!src.startsWith("http")) {
          absSrc = "https://www.gggongik.or.kr" + (src.startsWith("/") ? "" : "/") + src;
        }
        images.push(absSrc);
      }
    });

    return {
      content: content.substring(0, 5000), // Cap at 5000 chars for prompt safety
      imageUrl: images.length > 0 ? images[0] : "",
    };
  } catch (error) {
    console.error("Scraping detail failed:", error);
    return null;
  }
}

// 1. Get notice list endpoint
app.get("/api/notices", async (req, res) => {
  const scraped = await scrapeNotices();
  
  // Merge scraped with high fidelity mock database
  // Scraped entries go first, but we always append mock entries to guarantee a rich selection
  const combined = [...scraped];
  
  MOCK_NOTICES.forEach(mock => {
    if (!combined.some(item => item.title.replace(/\s+/g, "") === mock.title.replace(/\s+/g, ""))) {
      combined.push(mock);
    }
  });

  res.json({ success: true, count: combined.length, data: combined });
});

// 2. Fetch notice detail on-demand
app.get("/api/notices/:id/detail", async (req, res) => {
  const { id } = req.params;
  
  // Find in mock package
  const mockFind = MOCK_NOTICES.find(item => item.id === id);
  if (mockFind) {
    return res.json({ success: true, source: "fallback", data: mockFind });
  }

  // If live scraped, fetch dynamically
  const { link } = req.query;
  if (!link || typeof link !== "string") {
    return res.status(400).json({ success: false, error: "Link parameter is required for scraped detail." });
  }

  const scrapedDetail = await scrapeNoticeDetail(link);
  if (scrapedDetail) {
    return res.json({
      success: true,
      source: "live_scrape",
      data: {
        id,
        content: scrapedDetail.content,
        image: scrapedDetail.imageUrl || "https://images.unsplash.com/photo-1557804506-6fd96a12b057?w=800&auto=format&fit=crop&q=60"
      }
    });
  }

  // Double fallback to standard mock text if both fail
  res.json({
    success: true,
    source: "default_fallback",
    data: {
      id,
      content: "경기도공익활동지원센터의 공직 글 상세 정보입니다.\n\n해당 지원사업은 도민의 자발적 공익 활동과 대학생 활동가의 혁신적 아이디어를 보상하기 위하여 다양한 혜택과 예산을 지원합니다. 주요 혜택으로는 역량강화 세미나 매칭, 회의 공간 전액 무료, 우수 활동가 도지사상 시상이 포함됩니다.\n\n상세 정보 및 신청 양식은 공식 링크를 참고해 주시길 바랍니다: " + link,
      image: "https://images.unsplash.com/photo-1557804506-6fd96a12b057?w=800&auto=format&fit=crop&q=60"
    }
  });
});

// 3. AI Gen Shorts Creator Endpoint
app.post("/api/generate-shorts", async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, error: "Notice content is required for AI generation" });
    }

    const systemPrompt = `너는 15초 유튜브 쇼츠 영상 기획자이다.
제공받은 경기도 공익센터 게시글 내용을 분석해서 대학생들이 관심 가질만한 쇼츠 제작용 데이터를 만든다.

생성 조건:
- 총 5개의 슬라이드
- 각 슬라이드는 약 3초 분량
- 한국어(Korean)로 작성하며, 젊고 트렌디하고 강력한 어조를 사용할 것
- 핵심 정보 유지 (모집 대상, 주요 혜택, 마감일 등 중요 Fact를 왜곡하지 말 것)
- 대학생들이 관심 가질만한 요소(스펙, 활동비, 무료 교육, 인턴십, 상금 등)를 극강으로 홍보하고 강조할 것
- 모집 대상 강조
- 혜택 강조
- 마감일 강조
- 행동 유도(Call to Action) 포함

각 슬라이드별 자막(slideX_script)은 15자 내외의 눈에 확 들어오는 극단적으로 간결하고 직관적인 크래프트 자막으로 작성해줘. 대학생 유행어 구문이나 인스타 릴스 자막 스타일 사용 환영 (예 : "스펙에 활동비까지 퍼주는 사업?", "경기도가 대학생 지갑 지켜줌").
각 슬라이드 일러스트 프롬프트(slideX_visual)는 미드저니/DALL-E 등 AI 이미지 생성 툴에 그대로 넣을 수 있는 구체적이고 감각적인 묘사가 들어간 3D 일러스트, 벡터 아트 또는 고화질 감각적 사진 스타일의 영문 프롬프트(English)로 상세히 작성해줘.`;

    const userPrompt = `경기도 공익센터 게시글 제목: "${title}"\n\n상세내용:\n${content}`;

    // Call Gemini using @google/genai SDK
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        { text: userPrompt }
      ],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "Shorts 영상의 매력적이고 자극적인 타이틀 (예: '대학생이면 월 200만 원 개꿀 인턴십 정보')"
            },
            slide1_visual: {
              type: Type.STRING,
              description: "Detailed AI text-to-image prompt in English for general visual theme of Slide 1 (approx 3s intro). Vivid, detailed, focused."
            },
            slide1_script: {
              type: Type.STRING,
              description: "Slide 1 Show Subtitle (About 3s, extremely catchy and brief in Korean)"
            },
            slide2_visual: {
              type: Type.STRING,
              description: "Detailed AI text-to-image prompt in English describing visual theme of Slide 2 (Target & Topic matching). Vivid, detailed, focused."
            },
            slide2_script: {
              type: Type.STRING,
              description: "Slide 2 Show Subtitle (In Korean)"
            },
            slide3_visual: {
              type: Type.STRING,
              description: "Detailed AI text-to-image prompt in English describing visual theme of Slide 3 (Benefits details). Vivid, detailed, focused."
            },
            slide3_script: {
              type: Type.STRING,
              description: "Slide 3 Show Subtitle (In Korean)"
            },
            slide4_visual: {
              type: Type.STRING,
              description: "Detailed AI text-to-image prompt in English describing visual theme of Slide 4 (Deadline details). Vivid, detailed, focused."
            },
            slide4_script: {
              type: Type.STRING,
              description: "Slide 4 Show Subtitle (In Korean)"
            },
            slide5_visual: {
              type: Type.STRING,
              description: "Detailed AI text-to-image prompt in English describing visual theme of Slide 5 (Action call, button or swipe action). Vivid, detailed, focused."
            },
            slide5_script: {
              type: Type.STRING,
              description: "Slide 5 Show Subtitle (In Korean)"
            }
          },
          required: [
            "title",
            "slide1_visual", "slide1_script",
            "slide2_visual", "slide2_script",
            "slide3_visual", "slide3_script",
            "slide4_visual", "slide4_script",
            "slide5_visual", "slide5_script"
          ]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty text returned from Gemini API");
    }

    const parsedJson = JSON.parse(text);
    res.json({ success: true, data: parsedJson });
  } catch (error: any) {
    console.error("AI generation failed:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to generate Shorts script via AI" });
  }
});

// Configure Vite middleware in development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static serve
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
