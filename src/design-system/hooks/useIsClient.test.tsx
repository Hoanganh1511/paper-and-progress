import { renderToString } from "react-dom/server";
import { renderHook } from "@testing-library/react";
import { useIsClient } from "./useIsClient";

describe("useIsClient", () => {
  it("is true once rendered in the browser", () => {
    const { result } = renderHook(() => useIsClient());
    expect(result.current).toBe(true);
  });

  it("is false while rendering on the server", () => {
    function Probe() {
      return <span>{String(useIsClient())}</span>;
    }
    expect(renderToString(<Probe />)).toContain("false");
  });
});
