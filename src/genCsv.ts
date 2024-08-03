import * as path from 'path';
import * as fs from 'fs';
import { createObjectCsvWriter } from 'csv-writer';
import { extractJsdoc, getMaxDepth } from './utils';

function getPathLevels(relativePath: string, maxDepth: number): any {
  const parts = relativePath.split(path.sep);
  const pathLevels: any = {};
  parts.slice(0, parts.length - 1).forEach((part, index) => {
    pathLevels[`Path${index + 1}`] = part;
  });

  for (let i = parts.length - 1; i < maxDepth; i++) {
    pathLevels[`Path${i + 1}`] = '-';
  }

  return pathLevels;
}

async function getFileRows(basePath: string, folderPath: string, maxDepth: number): Promise<any[]> {
  const files = fs.readdirSync(folderPath);
  let rows: any[] = [];

  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const relativePath = path.relative(basePath, filePath);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      rows = rows.concat(await getFileRows(basePath, filePath, maxDepth));
    } else {
      const pathLevels = getPathLevels(relativePath, maxDepth);
      const { description, author } = await extractJsdoc(filePath);
      const row: any = { ...pathLevels, FileName: file, Author: author, Description: description, Etc: '' };
      rows.push(row);
    }
  }

  return rows;
}

export async function generateCsvTable(folderPath: string, csvFilePath: string): Promise<void> {
  const maxDepth = getMaxDepth(folderPath);

  let header = [
    { id: 'FileName', title: 'File Name' },
    { id: 'Author', title: 'Author' },
    { id: 'Description', title: 'Description' },
    { id: 'Etc', title: 'Etc' },
  ];
  
  if (maxDepth > 0) {
    header = Array.from({ length: maxDepth }, (_, i) => ({ id: `Path${i + 1}`, title: `Path${i + 1}` }))
      .concat(header);
  }

  const csvWriter = createObjectCsvWriter({
    path: csvFilePath,
    header: header,
  });

  const records = await getFileRows(folderPath, folderPath, maxDepth);

  await csvWriter.writeRecords(records);
}
