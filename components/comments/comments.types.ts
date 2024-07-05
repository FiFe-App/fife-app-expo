export interface CommentsProps {
  path: string;
  placeholder: string;
  limit: number;
}

export interface Comment {
  author: string;
  uid: string;
  text: string;
  date: string;
  key: string;
  fileName: string;
}
