export const AVATARS_BUCKET = "avatars";

/**
 * Thumbnails are stored next to the original (flat, not in a subfolder) so the
 * storage policies and the account deletion cleanup keep working unchanged.
 * They are always JPEG, whatever the original format was.
 */
export const getAvatarThumbnailFileName = (fileName: string) =>
  `thumb_${fileName.replace(/\.[^./]+$/, "")}.jpg`;

export const getAvatarPath = (uid: string, fileName: string) =>
  `${uid}/${fileName}`;

export const getAvatarThumbnailPath = (uid: string, fileName: string) =>
  `${uid}/${getAvatarThumbnailFileName(fileName)}`;
