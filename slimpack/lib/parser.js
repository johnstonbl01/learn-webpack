const path = require('path');

function createBundleFileList(entryPath, ast) {
  const fileList = [{ name: `./${path.basename(entryPath)}`, absPath: entryPath }];
  return walkTree(fileList, ast.body);
}

function walkTree(fileList, nodes) {
  if (nodes.length < 1) {
    return fileList;
  }
  
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].type === 'VariableDeclaration') {
      return walkTree(fileList, nodes[i].declarations);
    }
    
    if (nodes[i].type === 'VariableDeclarator' && nodes[i].init.callee.name === 'require') {
      const rootPath = path.dirname(fileList[0].absPath);
      const fileName = nodes[i].init.arguments[0].value;
      const absPath = path.resolve(rootPath, fileName);
      
      return walkTree([...fileList, { name: fileName, absPath }], []);
    }
  }
}

module.exports = createBundleFileList;