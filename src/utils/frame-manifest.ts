export const FRAME_CONFIG = {
  totalFrames: 288,
  prefix: '/sequences/nova-hero-v2/ezgif-frame-',
  extension: '.jpg',
};

export function getFramePath(index: number): string {
  const safeIndex = Math.max(1, Math.min(index, FRAME_CONFIG.totalFrames));
  const paddedIndex = safeIndex.toString().padStart(3, '0');
  return `${FRAME_CONFIG.prefix}${paddedIndex}${FRAME_CONFIG.extension}`;
}

export function getAllFramePaths(): string[] {
  const paths: string[] = [];
  for (let i = 1; i <= FRAME_CONFIG.totalFrames; i++) {
    paths.push(getFramePath(i));
  }
  return paths;
}
