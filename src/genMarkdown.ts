import * as path from 'path';
import * as fs from 'fs';
import { extractJsdoc, getMaxDepth } from "./utils";

function getPathLevels(relativePath: string): string[] {
  const parts = relativePath.split(path.sep);
  return parts.slice(0, parts.length - 1);
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
      const pathLevels = getPathLevels(relativePath);
      const {description, author } = await extractJsdoc(filePath);
      const pathColumns = pathLevels.concat(Array.from({ length: maxDepth - pathLevels.length }, () => '-')).join(' | ');
      rows += `| ${pathColumns} | ${file} | ${author} | ${description} | |\n`;
    }
  }

  return rows;
}

function generateTableHeader(maxDepth: number): string {
  let header = '| ' + Array.from({ length: maxDepth }, (_, i) => `Path${i + 1}`).join(' | ') + ' | File Name | 작성자 | 설명 | Etc |\n';
  header += '| ' + Array.from({ length: maxDepth }, () => '--------').join(' | ') + ' | --------- | -------- | ------ | --- |\n';
  return header;
}
  
export async function generateMarkdownTable(folderPath: string, mdFilePath: string): Promise<void> {
  const maxDepth = getMaxDepth(folderPath);
  const tableHeader = generateTableHeader(maxDepth);
  const tableRows = await getFileRows(folderPath, folderPath, maxDepth);
  const markdownContent = `${tableHeader}${tableRows}`;

  fs.writeFileSync(mdFilePath, markdownContent, 'utf8');
}
