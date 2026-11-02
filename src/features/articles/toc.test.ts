import { estimateReadingMinutes, htmlToText } from "./readingTime";
import { addHeadingIds, extractToc, headingSlug } from "./toc";

describe("headingSlug", () => {
  it("drops Vietnamese marks and symbols", () => {
    expect(headingSlug("Mở đầu & kết luận")).toBe("mo-dau-ket-luan");
    expect(headingSlug("???")).toBe("muc");
  });
});

describe("extractToc", () => {
  const html =
    "<h1>Skip</h1><h2>Giới thiệu</h2><p>x</p><h3>Cài đặt <em>nhanh</em></h3>" +
    "<h2>Giới thiệu</h2>";

  it("lists h2 and h3 only, with the markup removed from the text", () => {
    expect(extractToc(html)).toEqual([
      { id: "gioi-thieu", text: "Giới thiệu", level: 2 },
      { id: "cai-dat-nhanh", text: "Cài đặt nhanh", level: 3 },
      { id: "gioi-thieu-2", text: "Giới thiệu", level: 2 },
    ]);
  });

  it("puts matching ids on the headings", () => {
    const withIds = addHeadingIds(html);
    expect(withIds).toContain('<h2 id="gioi-thieu">Giới thiệu</h2>');
    expect(withIds).toContain('<h2 id="gioi-thieu-2">Giới thiệu</h2>');
    expect(withIds).toContain('<h3 id="cai-dat-nhanh">');
    expect(withIds).toContain("<h1>Skip</h1>");
  });

  it("returns nothing for an article without headings", () => {
    expect(extractToc("<p>Hi</p>")).toEqual([]);
  });
});

describe("readingTime", () => {
  it("is at least a minute and grows by 200 words", () => {
    expect(estimateReadingMinutes("")).toBe(1);
    expect(estimateReadingMinutes("a ".repeat(200))).toBe(1);
    expect(estimateReadingMinutes("a ".repeat(201))).toBe(2);
  });

  it("reads the text out of HTML", () => {
    expect(htmlToText("<p>A &amp; B</p><p>C</p>")).toBe("A & B\nC\n");
  });
});
