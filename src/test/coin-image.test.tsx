import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { CoinImage } from "@/components/game/CoinImage";
import { COINS } from "@/game/coins";

afterEach(cleanup);

it("falls back on broken artwork and retries when the known coin changes", () => {
  const first = { ...COINS[0]!, image: "https://example.test/broken.png" };
  const second = { ...COINS[1]!, image: "https://example.test/good.png" };
  const { rerender } = render(<CoinImage coin={first} />);
  fireEvent.error(screen.getByRole("img", { name: first.name }));
  expect(screen.getByRole("img", { name: first.name }).tagName).toBe("DIV");
  rerender(<CoinImage coin={second} />);
  expect(screen.getByRole("img", { name: second.name })).toHaveAttribute("src", second.image);
  rerender(<CoinImage coin={{ ...second, image: "" }} />);
  expect(screen.getByRole("img", { name: second.name }).tagName).toBe("DIV");
});
