// The cut. Put each generated clip in public/shots/ and set `clip` (e.g. 'shots/shot1.mp4');
// until then the shot shows its reference photo as an animatic placeholder.
export type Shot = {
  id: number;
  from: number; // seconds
  to: number;
  clip: string | null;
  ref: string;
  // placeholder camera: focus point (0..1) and zoom, start -> end
  f0: [number, number, number];
  f1: [number, number, number];
  note: string;
};

export const SHOTS: Shot[] = [
  { id: 1, from: 0, to: 3, clip: null, ref: 'ref/restaurant-green.jpg', f0: [0.42, 0.77, 2.0], f1: [0.55, 0.76, 2.2], note: 'Dining room, green velvet chairs, table set with a coupe glass' },
  { id: 2, from: 3, to: 6, clip: null, ref: 'ref/dish-angle.jpg', f0: [0.5, 0.55, 1.15], f1: [0.5, 0.55, 1.05], note: 'Hands place the plain round plate (2 meatballs + 2 rice balls)' },
  { id: 3, from: 6, to: 10, clip: null, ref: 'ref/dish-angle.jpg', f0: [0.27, 0.36, 2.3], f1: [0.29, 0.38, 2.45], note: 'Hands: piping white cream on each ball' },
  { id: 4, from: 10, to: 14, clip: null, ref: 'ref/dish-angle.jpg', f0: [0.68, 0.28, 2.3], f1: [0.66, 0.3, 2.45], note: 'Hands: spoon of onion-tomato jam' },
  { id: 5, from: 14, to: 19, clip: null, ref: 'ref/dish-angle.jpg', f0: [0.55, 0.48, 2.7], f1: [0.55, 0.46, 3.0], note: 'Hands + tweezers: microgreens & petals (slow motion)' },
  { id: 6, from: 19, to: 22, clip: null, ref: 'ref/dish-angle.jpg', f0: [0.35, 0.6, 1.6], f1: [0.4, 0.6, 1.7], note: 'Green oil drops, hand turns the coupe glass, leaves frame' },
  { id: 7, from: 22, to: 25, clip: null, ref: 'ref/dish-angle.jpg', f0: [0.5, 0.55, 1.2], f1: [0.5, 0.55, 1.08], note: 'Finished dish beside the glass, no hands' },
  { id: 8, from: 25, to: 30, clip: null, ref: 'ref/dish-top.jpg', f0: [0.5, 0.56, 1.0], f1: [0.5, 0.56, 1.1], note: 'Top-down hero, slow rotation, logo in the white space' },
];
