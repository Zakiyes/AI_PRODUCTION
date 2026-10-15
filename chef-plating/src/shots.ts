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
  { id: 1, from: 0, to: 4, clip: null, ref: 'ref/restaurant-green.jpg', f0: [0.42, 0.77, 2.0], f1: [0.55, 0.76, 2.2], note: 'Empty dining room, slow dolly between green velvet chairs' },
  { id: 2, from: 4, to: 7, clip: null, ref: 'ref/restaurant-green.jpg', f0: [0.78, 0.8, 2.6], f1: [0.66, 0.8, 2.7], note: 'Chef walks past chairs with the plate (chest down)' },
  { id: 3, from: 7, to: 10, clip: null, ref: 'ref/dish-angle.jpg', f0: [0.5, 0.55, 1.15], f1: [0.5, 0.55, 1.05], note: 'Hands set the plain plate down (no toppings)' },
  { id: 4, from: 10, to: 13.5, clip: null, ref: 'ref/dish-angle.jpg', f0: [0.27, 0.36, 2.3], f1: [0.29, 0.38, 2.45], note: 'Piping white cream on each croquette' },
  { id: 5, from: 13.5, to: 17, clip: null, ref: 'ref/dish-angle.jpg', f0: [0.68, 0.28, 2.3], f1: [0.66, 0.3, 2.45], note: 'Spoon of onion-tomato jam on the cream' },
  { id: 6, from: 17, to: 21.5, clip: null, ref: 'ref/dish-angle.jpg', f0: [0.55, 0.48, 2.7], f1: [0.55, 0.46, 3.0], note: 'Tweezers: microgreens + edible flowers (slow motion)' },
  { id: 7, from: 21.5, to: 24.5, clip: null, ref: 'ref/dish-angle.jpg', f0: [0.5, 0.55, 1.2], f1: [0.5, 0.55, 1.08], note: 'Last drops of green oil, hand leaves frame' },
  { id: 8, from: 24.5, to: 30, clip: null, ref: 'ref/dish-top.jpg', f0: [0.5, 0.56, 1.0], f1: [0.5, 0.56, 1.1], note: 'Top-down hero, slow rotation, logo in the white space' },
];
