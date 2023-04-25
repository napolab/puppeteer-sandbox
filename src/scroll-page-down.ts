import type { Page } from "puppeteer";

interface Options {
  size?: number;
  delay?: number;
  stepsLimit?: number | null;
}
type ScrollPageDown = (page: Page, options?: Options) => Promise<number>;

export const scrollPageDown: ScrollPageDown = async (
  page: Page,
  { size = 250, delay = 10, stepsLimit = null }: Options = {}
) => {
  const lastScrollPosition = await page.evaluate(
    async (pixelsToScroll, delayAfterStep, limit) => {
      const getElementScrollHeight = (element: HTMLElement): number => {
        const { scrollHeight, offsetHeight, clientHeight } = element;

        return Math.max(scrollHeight, offsetHeight, clientHeight);
      };

      const availableScrollHeight = getElementScrollHeight(document.body);
      let lastPosition = 0;

      const scrollFn = (resolve: (arg: number) => void): void => {
        const intervalId = setInterval(() => {
          window.scrollBy(0, pixelsToScroll);
          lastPosition += pixelsToScroll;

          if (lastPosition >= availableScrollHeight || (limit !== null && lastPosition >= pixelsToScroll * limit)) {
            clearInterval(intervalId);
            resolve(lastPosition);
          }
        }, delayAfterStep);
      };

      return await new Promise(scrollFn);
    },
    size,
    delay,
    stepsLimit
  );

  return lastScrollPosition;
};
