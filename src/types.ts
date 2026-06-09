export interface Notice {
  id: string;
  title: string;
  date: string;
  link: string;
  content_preview: string;
  content?: string;
  image?: string;
}

export interface SlideData {
  visual: string;
  script: string;
}

export interface ShortsData {
  title: string;
  slides: SlideData[];
}

export interface FinalMakePayload {
  original_post: Partial<Notice>;
  shorts_data: ShortsData;
}
