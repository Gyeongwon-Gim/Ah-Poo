export interface NaverBlogItem {
  title: string;
  link: string;
  description: string;
  bloggername: string;
  bloggerlink: string;
  postdate: string;
}

export interface NaverBlogSearchResult {
  items: NaverBlogItem[];
  total: number;
}
