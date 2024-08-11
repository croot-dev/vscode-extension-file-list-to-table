import * as vscode from 'vscode';
import * as fs from 'fs';
import { generateMarkdownTable } from './genMarkdown';
import { generateCsv } from './genCsv';
import path from 'path';
import { generateHtmlTable } from './genHtml';

async function openFile(filePath: string) {
  const doc = await vscode.workspace.openTextDocument(filePath);
  await vscode.window.showTextDocument(doc);
}

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand('fileList2Table.generateTable', async (uri: vscode.Uri) => {
    if (!uri || !fs.lstatSync(uri.fsPath).isDirectory()) {
      vscode.window.showErrorMessage('Please select a folder.');
      return;
    }

    const folderPath = uri.fsPath;
    const fileType = await vscode.window.showQuickPick(['Markdown', 'CSV', 'HTML'], {
      placeHolder: 'Select the file type for the table'
    });

    if (!fileType) {
      vscode.window.showInformationMessage('Operation cancelled.');
      return;
    }

    if (fileType === 'Markdown') {
      const mdFilePath = path.join(folderPath, 'folder_structure.md');
      await generateMarkdownTable(folderPath, mdFilePath);
      await openFile(mdFilePath);
      return;
    } else if (fileType === 'CSV') {
      const csvFilePath = path.join(folderPath, 'folder_structure.csv');
      await generateCsv(folderPath, csvFilePath);
      await openFile(csvFilePath);
      return;
    } else if (fileType === 'HTML') {
      const htmlFilePath = path.join(folderPath, 'folder_structure.html');
      await generateHtmlTable(folderPath, htmlFilePath);
      await openFile(htmlFilePath);
      return;
    }
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}
