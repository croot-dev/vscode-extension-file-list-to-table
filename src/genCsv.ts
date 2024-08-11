import * as path from 'path';
import * as fs from 'fs';
import { extractJsdoc, getColumns, getMaxDepth } from "./utils";

function getPathLevels(relativePath: string): string[] {
  const parts = relativePath.split(path.sep);
  return parts.slice(0, parts.length - 1);
}

async function getFileRows(basePath: string, folderPath: string, maxDepth: number): Promise<string[]> {
  const files = fs.readdirSync(folderPath);
  const rows: string[] = [];

  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      rows.push(...await getFileRows(basePath, filePath, maxDepth));
    } else {
      rows.push(await getFileRow(basePath, filePath, maxDepth));
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

  // 경로 레벨 추가
  const pathColumns = pathLevels
    .concat(Array.from({ length: maxDepth - pathLevels.length }, () => '-'))
    .join(', ');

  // CSV 행 구성
  const rowsArr = [pathColumns, fileName, ...docValues];
  return rowsArr.join(', ');
}

function generateCsvHeader(maxDepth: number): string {
  let header = "";
  if(maxDepth > 0) {
    header += Array.from({ length: maxDepth }, (_, i) => `경로${i + 1}`).join(', ') + ', ';
  }
  const columns = getColumns();
  header += `파일명, ${columns.map(col => col.title).join(', ')}\n`;

  return header;
}

export async function generateCsv(folderPath: string, csvFilePath: string): Promise<void> {
  const maxDepth = getMaxDepth(folderPath);
  const csvHeader = generateCsvHeader(maxDepth);
  const fileRows = await getFileRows(folderPath, folderPath, maxDepth);
  const csvContent = `${csvHeader}${fileRows.join('\n')}`;

  fs.writeFileSync(csvFilePath, csvContent, 'utf8');
}
