import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function getMaxDepth(folderPath: string): number {
  const getDepth = (folderPath: string): number => {
    return fs.readdirSync(folderPath).reduce((maxDepth, file) => {
      const filePath = path.join(folderPath, file);
      if (fs.statSync(filePath).isDirectory()) {
        return Math.max(maxDepth, getDepth(filePath) + 1);
      }
      return maxDepth;
    }, 0);
  };

  return getDepth(folderPath);
}

export async function extractJsdoc(filePath: string): Promise<Record<string, string>[]> {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const columns = getColumns();

  let result: Record<string, string>[] = [];
  if (Array.isArray(columns)) {
    result = columns.map(({key}) => {
      const regex = new RegExp(`@(?:${key})[ \\t]*:?[ \\t]*([^\\n\\r]+)`);
      const match =  fileContent.match(regex);
      return { key, value: match ? match[1] : '' }
    });
  }

  return result;
}

export function getColumns(): {key: string, title: string }[] {
  const config = vscode.workspace.getConfiguration('fileListToTable');
  const titleConfig = config.get<string>('fileNameLabel', 'File Name')
  const columnsConfig = config.get<Record<string, string>>('columns', {});

  return [{ key: 'fileNameLabel', title: titleConfig }]
    .concat(Object.entries(columnsConfig)
    .map(([key, title]) => ({ key, title })));
} 

export function getPathName(depth: number): string {
  const config = vscode.workspace.getConfiguration('fileListToTable');
  const titleConfig = config.get<string>('filePathLabel', 'Depth_{0}');
  
  return titleConfig.replace(/\{0\}/g, depth.toString());
}