// @ts-nocheck

import * as assert from 'assert';
import * as jsdoc from 'jsdoc-api';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
// import * as myExtension from '../../extension';

async function extractDescription(filePath: string): Promise<string> {
	try {
	  const docs = await jsdoc.explain({ files: filePath });
	  for (const doc of docs) {
		if (doc.tags) {
		  const descriptionTag = doc.tags;
		  if (descriptionTag) {
			return descriptionTag.description || '';
		  }
		}
	  }
	  return '';
	} catch (err) {
	  console.error(`Error parsing JSDoc for file ${filePath}:`, err);
	  return '';
	}
  }
  


suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Sample test', () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	});

	test('Extract Description', () => {
		extractDescription('./sample.vue')
			.then((result) => {
				console.debug(JSON.stringify(result));
				debugger
				assert.notEqual(-1, result.length);
			})
	});
});

