// Reusable spring configurations for consistent animation feel

export const SPRINGS = {
  // Fast, snappy — for caption pill entrance
  snappy: {
    damping: 14,
    stiffness: 200,
    mass: 1,
  },
  // Smooth, satisfying — for zoom and scroll
  smooth: {
    damping: 20,
    stiffness: 120,
    mass: 1,
  },
  // Very gentle — for Ken Burns / background motion
  gentle: {
    damping: 30,
    stiffness: 60,
    mass: 1,
  },
};
