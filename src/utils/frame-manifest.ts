export const FRAME_CONFIG = {
  totalFrames: 288,
  prefix: '/sequences/nova-hero-v2/ezgif-frame-',
  extension: '.jpg',
};

/**
 * Deterministically generates the path for a given frame index.
 * @param index Frame index (1-based)
 * @returns Correct padded asset path
 */
export function getFramePath(index: number): string {
  // Ensure the index is within bounds 1-151
  const safeIndex = Math.max(1, Math.min(index, FRAME_CONFIG.totalFrames));
  
  // Pad index to 3 digits (e.g., 1 -> '001', 151 -> '151')
  const paddedIndex = safeIndex.toString().padStart(3, '0');
  
  return `${FRAME_CONFIG.prefix}${paddedIndex}${FRAME_CONFIG.extension}`;
}

/**
 * Get all frame paths for preloading if needed.
 */
export function getAllFramePaths(): string[] {
  const paths: string[] = [];
  for (let i = 1; i <= FRAME_CONFIG.totalFrames; i++) {
    paths.push(getFramePath(i));
  }
  return paths;
}
