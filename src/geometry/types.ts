export type Point = {
  readonly x: number;
  readonly y: number;
};

export type Size = {
  readonly width: number;
  readonly height: number;
};

export type Rect = Size & {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
};

export type Bounds = Rect;

export type Position = {
  readonly left: number;
  readonly top: number;
};

export type Proximity = {
  readonly verticalDistance: number;
  readonly distance: number;
};

export type Connector = {
  readonly anchor: Point;
  readonly card: Point;
};

export type PreviewPositionInput = {
  readonly pointer: Point;
  readonly anchorRects: readonly Rect[];
  readonly cardSize: Size;
  readonly bounds: Bounds;
};
