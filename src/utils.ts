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

export async function extractJsdoc(filePath: string): Promise<{description: string, author: string}> {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const authorMatch = fileContent.match(/@(?:author)[ \t]*:?[ \t]*([^\n\r]+)/);
  const descriptionMatch = fileContent.match(/@(?:description|desc)[ \t]*:?[ \t]*([^\n\r]+)/);

  return {
    description:  descriptionMatch ? descriptionMatch[1].trim() : '-',
    author:  authorMatch ? authorMatch[1].trim() : '-'
  };
}
  