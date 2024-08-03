import * as path from 'path';
import * as fs from 'fs';
import { extractJsdoc, getMaxDepth } from './utils';

export async function generateHtmlTable(folderPath: string, htmlFilePath: string): Promise<void> {
  const maxDepth = getMaxDepth(folderPath);
  const actualMaxDepth = Math.max(maxDepth, 1); // maxDepth가 0인 경우 최소 1로 설정

  const header = generateTableHeader(actualMaxDepth);
  const rows = await getFileRows(folderPath, folderPath, maxDepth);
  const htmlContent = `
    <html>
    <head>
      <style>
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid black; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
      </style>
    </head>
    <body>
      <table>
        ${header}
        ${rows}
      </table>
    </body>
    </html>
  `;

  fs.writeFileSync(htmlFilePath, htmlContent, 'utf8');
}

function generateTableHeader(maxDepth: number): string {
  let header = '<tr>' + Array.from({ length: maxDepth }, (_, i) => `<th>Path${i + 1}</th>`).join('') + '<th>File Name</th><th>Author</th><th>Description</th><th>Etc</th></tr>';
  return header;
}

async function getFileRows(basePath: string, folderPath: string, maxDepth: number): Promise<string> {
  const files = fs.readdirSync(folderPath);
  let rows = '';

  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const relativePath = path.relative(basePath, filePath);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      rows += await getFileRows(basePath, filePath, maxDepth);
    } else {
      const pathLevels = getPathLevels(relativePath, maxDepth);
      const { description, author } = await extractJsdoc(filePath);
      const pathColumns = pathLevels.map(level => `<td>${level}</td>`).join('');
      rows += `<tr>${pathColumns}<td>${file}</td><td>${author}</td><td>${description}</td><td></td></tr>`;
    }
  }

  return rows;
}

function getPathLevels(relativePath: string, maxDepth: number): string[] {
  const parts = relativePath.split(path.sep);
  const pathLevels: string[] = [];
  parts.slice(0, parts.length - 1).forEach((part) => {
    pathLevels.push(part);
  });

  while (pathLevels.length < maxDepth) {
    pathLevels.push('-');
  }

  return pathLevels;
}
