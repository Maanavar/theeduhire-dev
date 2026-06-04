import chromium from "@sparticuz/chromium";
import puppeteer, { type Browser, type LaunchOptions, type Page } from "puppeteer-core";

export type { Browser, Page };

export async function launchScriptBrowser(options: LaunchOptions = {}): Promise<Browser> {
  return puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: process.env.CHROME_EXECUTABLE_PATH || (await chromium.executablePath()),
    headless: chromium.headless,
    ...options,
  });
}
