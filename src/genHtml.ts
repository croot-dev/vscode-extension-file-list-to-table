import * as path from 'path';
import * as fs from 'fs';
import { extractJsdoc, getColumns, getPathName, getMaxDepth } from "./utils";

function getPathLevels(relativePath: string): string[] {
  const parts = relativePath.split(path.sep);
  return parts.slice(0, parts.length - 1);
}

async function getFileRows(basePath: string, folderPath: string, maxDepth: number): Promise<string> {
  const files = fs.readdirSync(folderPath);
  let rows = '';

  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      rows += await getFileRows(basePath, filePath, maxDepth);
    } else {
      rows += await getFileRow(basePath, filePath, maxDepth);
    }
  }

  return rows;
}

async function getFileRow(basePath: string, filePath: string, maxDepth: number): Promise<string> {
  const relativePath = path.relative(basePath, filePath);
  const pathLevels = getPathLevels(relativePath);
  const docs = await extractJsdoc(filePath);
  
  // 파일명만 추출
  const fileName = path.basename(filePath);

  // docs.map을 실행할 수 있는지 확인 (예: docs가 객체가 아닌 배열일 때)
  const docValues = Array.isArray(docs) ? docs.map(col => col.value) : Object.values(docs);
  debugger
  
  const pathColumns = pathLevels
    .concat(Array.from({ length: maxDepth - pathLevels.length }, () => '-'))
    .map(col => `<td>${col}</td>`)
    .join('');
  const rowsArr = [
    ...docValues.map(value => `<td>${value}</td>`),
  ];
  
  if (maxDepth > 0) {
    rowsArr.unshift(pathColumns);
  }

  return `<tr>${rowsArr.join('')}</tr>\n`;
}

function generateTableHeader(maxDepth: number): string {
  let header = '<thead><tr>';
  if (maxDepth > 0) {
    header += Array.from({ length: maxDepth }, (_, i) => `<th>${getPathName(i + 1)}</th>`).join('');
  }
  const columns = getColumns();
  header += columns.map(col => `<th>${col.title}</th>`).join('');
  header += '</tr></thead>\n';
  return header;
}

export async function generateHtmlTable(folderPath: string, htmlFilePath: string): Promise<void> {
  const maxDepth = getMaxDepth(folderPath);
  const tableHeader = generateTableHeader(maxDepth);
  const tableRows = await getFileRows(folderPath, folderPath, maxDepth);
  const htmlContent = `<table>\n${tableHeader}<tbody>\n${tableRows}</tbody>\n</table>`;

  fs.writeFileSync(htmlFilePath, htmlContent, 'utf8');
}
