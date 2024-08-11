# File List to Table

> area for Logos  

> area for badges  

<p align="center">
    Gitmoji tool for git commit messages in VSCode
</p>

## 💻 Screenshot

![preview](./preview.gif)


## 📦 Install

1. Open [Visual Studio Code](https://code.visualstudio.com/).
2. Press `Ctrl+Shift+X` to open the Extensions tab.
3. Type `File List to Table` to find the extension.
4. Click the `Install` button, then the `Enable` button.

## 🔨 Configuration

### fileListToTable.columns
JSDoc tag name : header display name

example
```json
// settings.json
"fileListToTable.columns": {
    "author": "작성자",
    "description": "설명",
    "etc": "기타"
}
```
```vue
// sample.vue
<!--
  @author Croot
  @description This is sample component
  @etc for dev
-->
<template>
    <h1>SAMPLE PAGE</h1>
</template>
```
```markdown
//result
| 파일명 | 작성자 | 설명 | 기타 |
| ---------- | ----- | ------------------------ | ------- |
| sample.vue | Croot | This is sample component | for dev |
```

## 📃 License

The project is released under the MIT License, see the [LICENCE](https://github.com/seatonjiang/gitmoji-vscode/blob/main/LICENSE) file for details.