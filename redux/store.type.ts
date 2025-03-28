import { Comment } from "@/components/comments/comments.types";
import { Tables } from "@/database.types";
import { ImagePickerAsset } from "expo-image-picker";

export interface UserState {
  uid?: string;
  name?: string;
  userData?: {
    authorization: string;
    email: string;
    emailVerified: boolean;
    providerData: unknown;
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
  radius: number;
  location: string;
  authorName?: string;
  distance?: number;
  buzinessRecommendations: { author: string }[];
}
export interface BuzinessItemInterface {
  id: number;
  title: string;
  lat?: number;
  long?: number;
  location?: unknown;
  distance?: number;
  description: string;
  author: string;
  authorName?: string;
  avatarUrl?: string | null;
  images?: string[] | null;
  buzinessRecommendations: { author: string }[];
}
export interface EventItemInterface extends Tables<"events"> {
  lat: number | null;
  long: number | null;
  authorName?: string;
  avatarUrl?: string | null;
  eventResponses: Tables<"eventResponses">[];
}
export interface BuzinessSearchParams {
  text?: string;
  searchCircle?: {
    location: {
      latitude: number;
      longitude: number;
    };
    radius: number;
  };
  loading?: boolean;
  searchType?: string;
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
export interface LoadingProps {
  title: string;
  dismissable: boolean;
}

export interface SnackProps {
  title: string;
  onPress?: () => void;
}
export interface InfoState {
  dialogs: DialogProps[];
  options: OptionProps[];
  snacks: SnackProps[];
  loading?: LoadingProps;
  notificationToken: null | undefined | string;
}

export interface TutorialState {
  functions: string[];
}

export interface ImageDataType extends ImagePickerAsset {
  description?: string;
  path: string;
  url: string;
  status: "toUpload" | "uploaded" | "toDelete";
}
