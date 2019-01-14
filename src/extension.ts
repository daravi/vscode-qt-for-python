'use strict'
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'
import * as util from 'util'
import * as child_process from 'child_process'

let outputChannel: vscode.OutputChannel
let rootPath: undefined | string
if (vscode.workspace.workspaceFolders) {
    rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath
} else { rootPath = undefined }

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors
    // (console.error).
    // This line of code will only be executed once when your extension is
    // activated.
    console.log('The extension "vscode-qt-for-python" is now active!')

    outputChannel = vscode.window.createOutputChannel('Qt for Python')

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    context.subscriptions.push(vscode.commands.registerCommand(
        'extension.newForm', (fileUri: vscode.Uri) => {
            const toolPath = vscode.workspace.getConfiguration('qtForPython.path').get<string>('designer')
            if (toolPath) {
                if (fileUri) { // from explorer/context menus
                    exec(toolPath, { cwd: fileUri.fsPath })
                } else { // from command palette
                    exec(toolPath)
                }
            } else { showPathNotExist('Qt Designer') }
        }))
    context.subscriptions.push(vscode.commands.registerCommand(
        'extension.editForm', (fileUri: vscode.Uri) => {
            useTool('designer', 'Qt Design', fileUri)
        }))
    context.subscriptions.push(vscode.commands.registerCommand(
        'extension.editTranslation', (fileUri: vscode.Uri) => {
            useTool('linguist', 'Qt Linguist', fileUri)
        }))
    context.subscriptions.push(vscode.commands.registerCommand(
        'extension.releaseTranslation', (fileUri: vscode.Uri) => {
            useTool('lrelease', 'Qt lrelease', fileUri)
        }))
    context.subscriptions.push(vscode.commands.registerCommand(
        'extension.previewQml', (fileUri: vscode.Uri) => {
            useTool('qmlscene', 'QML Scene', fileUri)
        }))
}

// this method is called when your extension is deactivated
export function deactivate() {
}

function useTool(id: string, name: string, targetUri: vscode.Uri) {
    const toolPath = vscode.workspace.getConfiguration('qtForPython.path').get<string>(id)
    if (toolPath) {
        if (targetUri) { // from explorer/context menus
            exec(`${toolPath} ${targetUri.fsPath}`)
        } else { // from command palette
            const activeTextEditor = vscode.window.activeTextEditor
            if (activeTextEditor) {
                const documentUri = activeTextEditor.document.uri
                exec(`${toolPath} ${documentUri.fsPath}`)
            }
        }
    } else { showPathNotExist(name) }
}

async function showPathNotExist(name: string) {
    const response = await vscode.window.showErrorMessage(
        `${name} not found. Set the path of ${name} in Qt for Python section in`
        + 'the user setting.',
        'Setting'
    )
    if (response === 'Setting') {
        vscode.commands.executeCommand('workbench.action.openSettings')
    }
}

async function exec(file: string, options = { cwd: rootPath }) {
    let output
    try {
        output = await util.promisify(child_process.exec)(file, options)
    } catch (err) {
        vscode.window.showErrorMessage(err.message)
        outputChannel.appendLine(`[ERROR] ${err.message}`)
        outputChannel.show()
    }
    if (output && output.stdout) {
        outputChannel.appendLine(output.stdout.toString())
        outputChannel.show()
    }
    else if (output && output.stderr) {
        outputChannel.appendLine(`[ERROR] ${output.stderr.toString()}`)
        outputChannel.show()
    }
    return output
}