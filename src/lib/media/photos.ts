import sharp from "sharp";

const MAX_DIMENSION = 1920;
const MAX_SIZE_BYTES = 3 * 1024 * 1024; // 3 МБ

export type ProcessPhotoOptions = {
  maxWidth?: number;
  maxHeight?: number;
  maxSizeBytes?: number;
  quality?: number;
};

export type ProcessedPhoto = {
  buffer: Buffer;
  width: number;
  height: number;
  size: number;
  format: "image/webp";
  dataUrl: string;
};

function toBuffer(input: ArrayBuffer | Buffer): Buffer {
  return Buffer.isBuffer(input) ? input : Buffer.from(input);
}

export async function processRoutePhoto(
  input: ArrayBuffer | Buffer,
  options: ProcessPhotoOptions = {},
): Promise<ProcessedPhoto> {
  const buffer = toBuffer(input);
  const image = sharp(buffer, { failOn: "none" });
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("Не удалось определить размеры изображения");
  }

  const maxWidth = options.maxWidth ?? MAX_DIMENSION;
  const maxHeight = options.maxHeight ?? MAX_DIMENSION;
  const maxSizeBytes = options.maxSizeBytes ?? MAX_SIZE_BYTES;

  const resizeOptions = {
    width: Math.min(metadata.width, maxWidth),
    height: Math.min(metadata.height, maxHeight),
    fit: "inside" as const,
    withoutEnlargement: true,
  };

  let quality = options.quality ?? 85;
  let processed: Buffer = buffer;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    processed = await image
      .clone()
      .resize(resizeOptions)
      .withMetadata({ orientation: metadata.orientation })
      .webp({ quality, effort: 5 })
      .toBuffer();

    if (processed.byteLength <= maxSizeBytes || quality <= 45) {
      break;
    }

    quality = Math.max(45, quality - 10);
  }

  if (processed.byteLength > maxSizeBytes) {
    throw new Error("Не удалось сжать изображение до 3 МБ");
  }

  const finalMeta = await sharp(processed).metadata();
  const width = finalMeta.width ?? resizeOptions.width ?? metadata.width;
  const height = finalMeta.height ?? resizeOptions.height ?? metadata.height;

  const dataUrl = `data:image/webp;base64,${processed.toString("base64")}`;

  return {
    buffer: processed,
    width,
    height,
    size: processed.byteLength,
    format: "image/webp",
    dataUrl,
  };
}
