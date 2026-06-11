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

const renderPdfBuffer = async (html: string) => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

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
