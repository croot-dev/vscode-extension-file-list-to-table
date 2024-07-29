// @ts-nocheck

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as jsdoc from 'jsdoc-api';

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
  const maxDepth = getMaxDepth(folderPath);
  const tableHeader = generateTableHeader(maxDepth);
  const tableRows = await getFileRows(folderPath, folderPath, maxDepth);
  return `${tableHeader}${tableRows}`;
}

function generateTableHeader(maxDepth: number): string {
  let header = '| ' + Array.from({ length: maxDepth }, (_, i) => `Path${i + 1}`).join(' | ') + ' | File Name | 설명 | Etc |\n';
  header += '| ' + Array.from({ length: maxDepth }, () => '--------').join(' | ') + ' | --------- | ------ | --- |\n';
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
      const description = await extractDescription(filePath);
      const pathColumns = pathLevels.concat(Array.from({ length: maxDepth - pathLevels.length }, () => '-')).join(' | ');
      rows += `| ${pathColumns} | ${file} | ${description} | |\n`;
    }
  }

  return rows;
}

function getPathLevels(relativePath: string): string[] {
  const parts = relativePath.split(path.sep);
  return parts.slice(0, parts.length - 1);
}

async function extractDescription(filePath: string): Promise<string> {
  try {
    const docs = await jsdoc.explain({ files: filePath });
    for (const doc of docs) {
      if (doc.description) {
        return doc.description;
      }
    }
    return '';
  } catch (err) {
    console.error(`Error parsing JSDoc for file ${filePath}:`, err);
    return '';
  }
}

export function deactivate() {}
