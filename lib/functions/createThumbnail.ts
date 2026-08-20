import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

/**
 * Wide enough for the biggest inline avatar (100pt on a 3x screen), while
 * staying a few tens of kilobytes instead of the multi-megabyte original.
 */
export const AVATAR_THUMBNAIL_SIZE = 320;

/**
 * Downscaled JPEG copy of a picked image. Only the width is given so the
 * aspect ratio is preserved — the picker's crop is not guaranteed on web.
 */
const createThumbnail = async (
  uri: string,
  width: number = AVATAR_THUMBNAIL_SIZE,
) => {
  const image = await ImageManipulator.manipulate(uri)
    .resize({ width })
    .renderAsync();

  return image.saveAsync({
    format: SaveFormat.JPEG,
    compress: 0.6,
    base64: true,
  });
};

export default createThumbnail;
