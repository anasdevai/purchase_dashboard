import fs from "node:fs";
import puppeteer from "puppeteer";

export type PdfRenderOptions = {
  /** When true, render edge-to-edge (no page margins) so the template controls its own padding. */
  fullBleed?: boolean;
};

const DEFAULT_MARGIN = {
  top: "12mm",
  right: "12mm",
  bottom: "14mm",
  left: "12mm"
};

const ZERO_MARGIN = {
  top: "0mm",
  right: "0mm",
  bottom: "0mm",
  left: "0mm"
};

const buildPdfOptions = (options?: PdfRenderOptions) => ({
  format: "A4" as const,
  printBackground: true,
  margin: options?.fullBleed ? ZERO_MARGIN : DEFAULT_MARGIN
});

const LAUNCH_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--disable-gpu"
];

const CHROME_INSTALL_HINT =
  "Install Chrome for PDF generation with: npx puppeteer browsers install chrome";

const fileExists = (filePath: string): boolean => {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
};

const getPuppeteerBundledPath = async (): Promise<string | null> => {
  try {
    const bundledPath = await puppeteer.executablePath();
    return bundledPath && fileExists(bundledPath) ? bundledPath : null;
  } catch {
    return null;
  }
};

const findFirstExisting = (candidates: string[]): string | null => {
  for (const candidate of candidates) {
    if (fileExists(candidate)) {
      return candidate;
    }
  }
  return null;
};

const resolveChromiumExecutablePath = async (): Promise<string | null> => {
  const envPath = process.env.PUPPETEER_EXECUTABLE_PATH?.trim();
  if (envPath) {
    if (fileExists(envPath)) {
      return envPath;
    }
    console.warn(
      `[pdf] PUPPETEER_EXECUTABLE_PATH is set to "${envPath}" but the file was not found. Falling back to auto-detection.`
    );
  }

  const bundledPath = await getPuppeteerBundledPath();
  if (bundledPath) {
    return bundledPath;
  }

  if (process.platform === "win32") {
    return findFirstExisting([
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"
    ]);
  }

  if (process.platform === "linux") {
    // Alpine Linux (Docker) installs Chromium as chromium-browser.
    return findFirstExisting([
      "/usr/bin/chromium-browser",
      "/usr/bin/chromium",
      "/usr/bin/google-chrome-stable",
      "/usr/bin/google-chrome"
    ]);
  }

  return null;
};

const launchBrowser = async () => {
  const executablePath = await resolveChromiumExecutablePath();
  const launchOptions: Parameters<typeof puppeteer.launch>[0] = {
    headless: true,
    args: LAUNCH_ARGS
  };

  if (executablePath) {
    console.log(`Using Chromium executable: ${executablePath}`);
    launchOptions.executablePath = executablePath;
  } else {
    console.log("Using Puppeteer default bundled Chromium");
  }

  try {
    return await puppeteer.launch(launchOptions);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[pdf] Failed to launch Chromium:", message);
    throw new Error(`Failed to launch browser for PDF generation. ${CHROME_INSTALL_HINT}\n${message}`);
  }
};

const renderPdfBuffer = async (html: string, options?: PdfRenderOptions) => {
  const browser = await launchBrowser();

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    return Buffer.from(await page.pdf(buildPdfOptions(options)));
  } finally {
    await browser.close();
  }
};

export const renderHtmlToPdfBuffer = (html: string, options?: PdfRenderOptions) =>
  renderPdfBuffer(html, options);

export const renderHtmlToPdf = async (
  html: string,
  outputPath: string,
  options?: PdfRenderOptions
) => {
  const pdfBuffer = await renderPdfBuffer(html, options);
  await fs.promises.writeFile(outputPath, pdfBuffer);
};
