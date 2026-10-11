import type { ComponentType } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { COINS, type Coin } from "@/game/coins";
import { stats } from "@/game/storage";
import { Route } from "@/routes/index";

vi.mock("@/components/game/Backdrop", () => ({ Backdrop: () => null }));
// Isolate timer/state transitions from the already preserved coin animations.
vi.mock("@/components/game/CoinPanel", () => ({
  CoinPanel: ({
    coin,
    side,
    revealed,
    onGuess,
    versus,
  }: {
    coin: Coin;
    side: string;
    revealed: boolean;
    versus?: Coin;
    onGuess?: (g: "higher" | "lower") => void;
  }) => (
    <section aria-label={side}>
      <p>{coin.name}</p>
      {side === "challenger" && !revealed && (
        <>
          <button onClick={() => onGuess?.(coin.cap > versus!.cap ? "higher" : "lower")}>
            Correct guess
          </button>
          <button onClick={() => onGuess?.(coin.cap > versus!.cap ? "lower" : "higher")}>
            Wrong guess
          </button>
        </>
      )}
    </section>
  ),
}));

const App = Route.options.component as ComponentType;
const advance = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms);
  });
const click = (name: string) => fireEvent.click(screen.getByRole("button", { name }));

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("Gameplay and game over", () => {
  it.each(["CLASSIC", "BEAT THE CLOCK"])(
    "clears All Memecoins and earns Legendary Degen in %s",
    (mode) => {
      render(<App />);
      click(mode);
      for (let i = 0; i < 29; i++) {
        click("Correct guess");
        advance(1500);
      }
      expect(screen.getByText("You cleared every coin!")).toBeInTheDocument();
      expect(screen.getByText("Legendary Degen")).toBeInTheDocument();
      expect(stats(mode === "CLASSIC" ? "classic" : "clock", "all").best).toBe(29);
    },
  );

  it("ignores a second submission during the same reveal", () => {
    render(<App />);
    click("CLASSIC");
    const button = screen.getByRole("button", { name: "Correct guess" });
    act(() => {
      button.click();
      button.click();
    });
    expect(screen.getByRole("status")).toHaveTextContent("Score: 1");
    advance(1500);
    click("Wrong guess");
    advance(1500);
    expect(stats("classic", "all")).toEqual({ best: 1, average: 1, games: 1 });
  });

  it.each(["CLASSIC", "BEAT THE CLOCK"])(
    "scores once and shows the correct rank, sharing and replay in %s",
    (mode) => {
      render(<App />);
      click(mode);
      for (let i = 0; i < 4; i++) {
        click("Correct guess");
        advance(1500);
      }
      click("Wrong guess");
      advance(1500);
      expect(screen.getByText("Certified Jeet")).toBeInTheDocument();
      const share = new URL(screen.getByRole("link", { name: "SHARE ON 𝕏" }).getAttribute("href")!);
      expect(share.searchParams.get("text")).toContain("I scored 4 on PEAK OR JEET");
      expect(share.searchParams.get("text")).toContain("Certified Jeet");
      expect(share.searchParams.get("url")).toMatch(/^https?:\/\//);
      expect(screen.getByRole("link", { name: "Buy $PEAK" })).toHaveAttribute(
        "href",
        "https://pump.fun/",
      );
      const key = mode === "CLASSIC" ? "classic" : "clock";
      expect(stats(key, "all")).toEqual({ best: 4, average: 4, games: 1 });
      click("PLAY AGAIN");
      expect(screen.getByRole("status")).toHaveTextContent("Score: 0");
      click("Wrong guess");
      advance(1500);
      expect(stats(key, "all")).toEqual({ best: 4, average: 2, games: 2 });
      click("BACK TO MENU");
      expect(screen.getByText(/Personal best/)).toHaveTextContent("4");
    },
  );

  it("credits a correct guess before expiry, ends exactly once and shows the clock rank", () => {
    render(<App />);
    click("BEAT THE CLOCK");
    for (let i = 0; i < 3; i++) {
      click("Correct guess");
      advance(1500);
    }
    advance(55000); // 59.5 seconds after start
    click("Correct guess");
    advance(500);
    expect(screen.getByText("Time's up!")).toBeInTheDocument();
    expect(screen.getByText("Certified Jeet")).toBeInTheDocument();
    advance(5000);
    expect(stats("clock", "all")).toEqual({ best: 4, average: 4, games: 1 });
  });

  it("rejects answers after the wall-clock deadline even before the interval fires", () => {
    render(<App />);
    click("BEAT THE CLOCK");
    vi.setSystemTime(Date.now() + 61000);
    click("Correct guess");
    expect(screen.getByText("Time's up!")).toBeInTheDocument();
    expect(stats("clock", "all").best).toBe(0);
  });

  it("cancels pending reveal work when quitting without recording a game", () => {
    render(<App />);
    click("CLASSIC");
    click("Wrong guess");
    fireEvent.click(screen.getByRole("button", { name: "Back to PEAK OR JEET menu" }));
    click("BEAT THE CLOCK");
    advance(1500);
    expect(screen.queryByText("Game over")).not.toBeInTheDocument();
    expect(stats("classic", "all").games).toBe(0);
    expect(screen.getByRole("status")).toHaveTextContent("Score: 0");
  });

  it.each(["CLASSIC", "BEAT THE CLOCK"])(
    "finishes Trenches Only with the earned Veteran rank in %s",
    (mode) => {
      render(<App />);
      click("TRENCHES ONLY");
      click(mode);
      const seen = new Set<string>();
      const initial = screen.getByRole("region", { name: "known" }).textContent!;
      seen.add(initial);
      for (let i = 0; i < 11; i++) {
        const challenger = screen
          .getByRole("region", { name: "challenger" })
          .querySelector("p")!.textContent!;
        expect(seen.has(challenger)).toBe(false);
        expect(COINS.find((c) => c.name === challenger)?.category).toBe("Trenches");
        seen.add(challenger);
        click("Correct guess");
        advance(1500);
      }
      expect(screen.getByText("You cleared every coin!")).toBeInTheDocument();
      expect(screen.getByText("Trench Veteran")).toBeInTheDocument();
      expect(stats(mode === "CLASSIC" ? "classic" : "clock", "trenches").best).toBe(11);
    },
  );
});
