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
  locationError: string | null;
}
export interface CommentsState {
  comments: Comment[];
}

export type Buziness = Tables<"buziness">;

export interface BuzinessSearchItemInterface {
  id: number;
  title: string;
  description: string;
  author: string;
  recommendations: number;
  authorName?: string;
  distance?: number;
}
export interface BuzinessItemInterface {
  id: number;
  title: string;
  lat: number;
  long: number;
  distance?: number;
  description: string;
  author: string;
  authorName?: string;
  avatarUrl?: string | null;
  buzinessRecommendations: { author: string }[];
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
  buzinesses: BuzinessSearchItemInterface[];
  buzinessSearchParams?: BuzinessSearchParams;
}

export interface DialogProps {
  title: string;
  text: string;
  onSubmit: () => void;
  onCancel?: () => void;
  submitText?: string;
  dismissable?: boolean;
}
export interface OptionProps {
  icon: string;
  title: string;
  disabled?: boolean;
  onPress: () => void;
}

export interface SnackProps {
  title: string;
  onPress?: () => void;
}
export interface InfoState {
  dialogs: DialogProps[];
  options: OptionProps[];
  snacks: SnackProps[];
}

export interface TutorialState {
  functions: string[];
}
