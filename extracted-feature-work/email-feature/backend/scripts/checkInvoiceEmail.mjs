import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const prisma = new PrismaClient();

async function main() {
  const invoices = await prisma.invoice.findMany({
    select: {
      id: true,
      invoiceNumber: true,
      customerEmail: true,
      pdfPath: true,
      userId: true
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  
  console.log('Recent invoices:');
  invoices.forEach(inv => {
    console.log('---');
    console.log('ID:', inv.id);
    console.log('Number:', inv.invoiceNumber);
    console.log('Email:', inv.customerEmail);
    console.log('pdfPath stored:', inv.pdfPath);
    
    if (inv.pdfPath) {
      const absPath = path.isAbsolute(inv.pdfPath) 
        ? inv.pdfPath 
        : path.join(projectRoot, inv.pdfPath);
      const exists = fs.existsSync(absPath);
      console.log('Resolved abs path:', absPath);
      console.log('PDF file exists on disk:', exists);
    }
  });
  
  await prisma.$disconnect();
}

main().catch(e => { console.error('DB Error:', e.message); process.exit(1); });
