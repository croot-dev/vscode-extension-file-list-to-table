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
  let header = '| ' + Array.from({ length: maxDepth }, (_, i) => `Path${i + 1}`).join(' | ') + ' | File Name | Description | Etc |\n';
  header += '| ' + Array.from({ length: maxDepth }, () => '--------').join(' | ') + ' | --------- | ----------- | --- |\n';
  return header;
}

function getMaxDepth(folderPath: string): number {
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
      const description = await extractDescription(filePath);
      const pathColumns = pathLevels.concat(Array.from({ length: getMaxDepth(basePath) - pathLevels.length }, () => '-')).join(' | ');
      rows += `| ${pathColumns} | ${file} | ${description} | |\n`;
    }
  }

  return rows;
}

function getPathLevels(relativePath: string): string[] {
  return relativePath.split(path.sep).filter(part => part !== '');
}

async function extractDescription(filePath: string): Promise<string> {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const descriptionMatch = fileContent.match(/@description\s+([^\n\r]+)/);
  return descriptionMatch ? descriptionMatch[1].trim() : '';
}

export function deactivate() {}
