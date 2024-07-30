import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand('extension.toTable', async (uri: vscode.Uri) => {
    if (!uri || !fs.lstatSync(uri.fsPath).isDirectory()) {
      vscode.window.showErrorMessage('Please select a folder.');
      return;
    }

    const folderPath = uri.fsPath;
    const markdownTable = await generateMarkdownTable(folderPath);

    const doc = await vscode.workspace.openTextDocument({
      content: markdownTable,
      language: 'markdown'
    });

    await vscode.window.showTextDocument(doc);
  });

  context.subscriptions.push(disposable);
}

async function generateMarkdownTable(folderPath: string): Promise<string> {
  const tableHeader = generateTableHeader(folderPath);
  const tableRows = await getFileRows(folderPath, folderPath);
  return `${tableHeader}${tableRows}`;
}

function generateTableHeader(folderPath: string): string {
  const maxDepth = getMaxDepth(folderPath);
  const actualMaxDepth = Math.max(maxDepth, 1); // maxDepth가 0인 경우 최소 1로 설정

  let header = '| ' + Array.from({ length: actualMaxDepth }, (_, i) => `Path${i + 1}`).join(' | ') + ' | File Name | Author | Description | Etc |\n';
  header += '| ' + Array.from({ length: actualMaxDepth }, () => '--------').join(' | ') + ' | --------- | --------- | ----------- | --- |\n';
  
  return header;
}

function getMaxDepth(folderPath: string): number {
  const getDepth = (folderPath: string) => {
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

async function getFileRows(basePath: string, folderPath: string): Promise<string> {
  const files = fs.readdirSync(folderPath);
  let rows = '';

  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const relativePath = path.relative(basePath, filePath);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      // Process the directory recursively
      rows += await getFileRows(basePath, filePath);
    } else {
      const pathLevels = getPathLevels(relativePath);
      const { description, author } = await extractJsdoc(filePath);
      const pathColumns = pathLevels.concat(Array.from({ length: getMaxDepth(basePath) - pathLevels.length }, () => '-')).join(' | ');
      rows += `| ${pathColumns} | ${file} | ${author} | ${description} | |\n`;
    }
  }

  return rows;
}

function getPathLevels(relativePath: string): string[] {
  return relativePath.split(path.sep).filter(part => part !== '');
}

async function extractJsdoc(filePath: string): Promise<{description: string, author: string}> {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const descriptionMatch = fileContent.match(/@설명[ ]?:([^\n\r]+)/);
  const authorMatch = fileContent.match(/@작성자[ ]?:([^\n\r]+)/);

  return {
    description:  descriptionMatch ? descriptionMatch[1].trim() : '-',
    author:  authorMatch ? authorMatch[1].trim() : '-'
  };
}

export function deactivate() {}
