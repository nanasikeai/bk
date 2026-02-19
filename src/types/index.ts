export interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  coverImage: string | null;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
  categoryId: number | null;
  category?: Category | null;
  tags?: Tag[];
  comments?: Comment[];
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  posts?: Post[];
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
  posts?: Post[];
}

export interface Comment {
  id: number;
  author: string;
  email: string;
  content: string;
  createdAt: Date;
  postId: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
