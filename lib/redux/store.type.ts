import { Comment } from "@/components/comments/comments.types";
import { Tables } from "@/database.types";

export interface UserState {
  uid?: string;
  name?: string;
  userData?: {
    authorization: string;
    email: string;
    emailVerified: boolean;
    providerData: any;
    createdAt: Date;
    lastLoginAt: Date;
  } | null;
}
export interface CommentsState {
  comments: Comment[];
}

export type Buziness = Tables<"buziness">;

export interface BuzinessItemInterface {
  id: number;
  title: string;
  description: string;
  author: string;
  lat: number;
  long: number;
  distance: number;
}
export interface BuzinessSearchParams {
  text?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  skip?: number;
}
export interface BuzinessState {
  buzinesses: BuzinessItemInterface[];
  buzinessSearchParams?: BuzinessSearchParams;
}
