import { placeBar } from "./TableTools";

// A screen 800 tall, the site header reaching down to 72, a bar 44 tall.
const view = { top: 72, height: 800 };
const height = 44;
const table = (top: number, bottom: number) => ({ top, bottom, left: 100 });

describe("placeBar", () => {
  it("goes right over the table when there is room above it", () => {
    expect(placeBar(table(300, 500), height, view)).toEqual({
      top: 300 - height - 8,
      placement: "above",
    });
  });

  it("fits above even when it just touches the header's edge", () => {
    expect(placeBar(table(72 + height + 8, 600), height, view)).toEqual({
      top: 72,
      placement: "above",
    });
  });

  it("goes under a table that starts too near the top, if its bottom is on screen", () => {
    expect(placeBar(table(90, 300), height, view)).toEqual({
      top: 308,
      placement: "below",
    });
  });

  it("stays at the top of the screen over a long table that starts above it", () => {
    // the table runs from far above to well below the screen
    expect(placeBar(table(-900, 1500), height, view)).toEqual({
      top: 72,
      placement: "stuck",
    });
    // still holds while a little of it is left
    expect(placeBar(table(-400, 400), height, view)).toEqual({
      top: 72,
      placement: "stuck",
    });
  });

  it("holds at the top over a long table that starts in view but has no room above or below", () => {
    // starts just under the header, and ends below the screen: the bar cannot go under it
    expect(placeBar(table(80, 2000), height, view)).toEqual({
      top: 80,
      placement: "stuck",
    });
  });

  it("slides away with the table's end instead of hanging below it", () => {
    // only 30 of the table is still on screen: the bar may not go past its end
    const { top, placement } = placeBar(table(-700, 102), height, view);
    expect(placement).toBe("stuck");
    expect(top).toBe(102 - height);
    expect(top).toBeLessThan(72);
  });
});
