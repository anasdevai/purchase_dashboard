import fs from "node:fs";
import puppeteer from "puppeteer";

const pdfOptions = {
  format: "A4" as const,
  printBackground: true,
  margin: {
    top: "12mm",
    right: "12mm",
    bottom: "14mm",
    left: "12mm"
  }
};

const LAUNCH_ARGS = ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"];

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
    return findFirstExisting([
      "/usr/bin/chromium",
      "/usr/bin/chromium-browser",
      "/usr/bin/google-chrome",
      "/usr/bin/google-chrome-stable"
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
    throw new Error(`Failed to launch browser for PDF generation. ${CHROME_INSTALL_HINT}\n${message}`);
  }
};

const renderPdfBuffer = async (html: string) => {
  const browser = await launchBrowser();

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    return Buffer.from(await page.pdf(pdfOptions));
  } finally {
    await browser.close();
  }
};

export const renderHtmlToPdfBuffer = (html: string) => renderPdfBuffer(html);

export const renderHtmlToPdf = async (html: string, outputPath: string) => {
  const pdfBuffer = await renderPdfBuffer(html);
  await fs.promises.writeFile(outputPath, pdfBuffer);
};
