import { Comment } from "@/components/comments/comments.types";
import { Tables } from "@/database.types";
import { ImagePickerAsset } from "expo-image-picker";

export interface EmotionLogLocal {
  log_date: string;
  rate: number;
  note?: string;
  synced: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmotionLogsState {
  logs: EmotionLogLocal[];
}

export interface TaskItem {
  id: string;
  title: string;
  checked: boolean;
}

export interface NotificationPrefs {
  notifyPush: boolean;
  notifyEmail: boolean;
  newsletter: boolean;
  emotionDailyPrompt: boolean;
  /** null = the user has never been asked this question. */
  pushAskedAt: string | null;
  emotionPromptAskedAt: string | null;
  newsletterAskedAt: string | null;
}

export interface UserState {
  uid?: string;
  name?: string;
  mantra?: string;
  messagingEnabled?: boolean;
  tasks?: TaskItem[];
  isItSafeDismissed?: boolean;
  inviteCardDismissed?: boolean;
  notificationPrefs?: NotificationPrefs;
  userData?: {
    authorization: string;
    email: string;
    emailVerified: boolean;
    providerData: unknown;
    createdAt: Date;
    lastLoginAt: Date;
    avatar_url?: string | null;
    location?: {
      lng: number;
      lat: number;
      radius?: number;
    };
  } | null;
  locationError: string | null;
  themePreference: "light" | "dark" | "auto";
  savedBuzinesses: number[];
  previousSearches: string[];
  /**
   * `updated_at` of the user_settings row this state was last hydrated from or
   * pushed to. Undefined means "never synced with the server on this device".
   */
  settingsSyncedAt?: string;
}

/**
 * The preference set that useUserSettings mirrors to public.user_settings.
 * `mantra`, `tasks` and `previousSearches` travel inside the row's encrypted
 * blob; the rest are plain columns. See lib/crypto/settingsEncryption.ts.
 *
 * The notification columns of that same row are deliberately absent here:
 * useNotificationPrefs owns them, writing each one as the user answers it. The
 * two hooks touch disjoint columns, so neither can clobber the other.
 */
export interface UserSettingsPayload {
  mantra?: string;
  tasks: TaskItem[];
  previousSearches: string[];
  themePreference: "light" | "dark" | "auto";
  savedBuzinesses: number[];
  isItSafeDismissed: boolean;
  inviteCardDismissed: boolean;
  homeAddBuzinessCardDismissed: boolean;
}

export type User = Tables<"profiles"> & {
    buzinesses: { title: string }[];
    profileRecommendations?: { count: number }[];
  };

/** Return type of the nearest_profiles RPC */
export interface NearestProfile {
  id: string;
  full_name: string;
  username: string | null;
  avatar_url: string | null;
  website: string | null;
  created_at: string | null;
  recommendations: number;
  lat: number;
  long: number;
  distance: number;
  buzinesses: { title: string }[];
}

export interface UsersState {
  users: User[];
  userSearchParams?: SearchParams;
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
  location?: string;
  authorName?: string;
  distance?: number;
  relevance: number;
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
  images?: MediaDataType[];
  recommendations: number | { count: number }[];
  created_at?: string;
  ingyen?: boolean;
}
export interface EventItemInterface extends Tables<"events"> {
  lat: number | null;
  long: number | null;
  authorName?: string;
  avatarUrl?: string | null;
  eventResponses: Tables<"eventResponses">[];
}

export interface CircleType {
    location: {
      latitude: number;
      longitude: number;
    };
    radius: number;
  }
export interface SearchParams {
  text?: string;
  searchCircle?: CircleType;
  loading?: boolean;
  searchType?: string;
  skip?: number;
  ingyen?: boolean;
}
export interface BuzinessState {
  buzinesses: BuzinessSearchItemInterface[];
  searchParams?: SearchParams;
  hasMore?: boolean;
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
  buttonText?: string;
}
export interface InfoState {
  dialogs: DialogProps[];
  options: OptionProps[];
  snacks: SnackProps[];
  loading?: LoadingProps;
  notificationToken: null | undefined | string;
  policiesAccepted: boolean;
  statusBarColor: string | null;
  bottomBarColor: string | null;
}

export interface LayoutRectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TutorialState {
  functions: string[];
  isTutorialActive: boolean;
  isTutorialStarted?: boolean;
  tutorialStep: number;
  tutorialLayouts: { [key: string]: LayoutRectangle };
}

export interface ChatState {
  drafts: Record<string, string>;
  lastReadAt: Record<string, string>;
  unreadCounts: Record<string, number>;
}

export type MediaKindType = "image" | "video" | "audio";

export interface MediaDataType extends ImagePickerAsset {
  description?: string;
  path: string;
  url: string;
  status: "toUpload" | "uploaded" | "toDelete";
  /**
   * Only images were supported at first, so this can be missing on older
   * records — use `getMediaKind` instead of reading it directly.
   */
  mediaType?: MediaKindType;
}
