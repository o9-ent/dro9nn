# IDE Integration Guide

This guide covers IDE integrations for the o9nn Cognitive Platform.

## VSCode

The official o9nn extension for Visual Studio Code provides full integration with the platform.

### Installation

1. Download from [VSCode Marketplace](https://marketplace.visualstudio.com/items?itemName=o9nn.o9nn-cognitive)
2. Or install from VSIX:
   ```bash
   cd tools/vscode-extension
   npm install
   npm run package
   code --install-extension o9nn-cognitive-*.vsix
   ```

### Features

- **Model Management**: List, download, and manage AI models
- **Agent Development**: Create and test AI agents
- **REPL Integration**: Interactive model interaction
- **Code Generation**: Generate agents, tools, and plugins
- **Syntax Highlighting**: Support for o9nn configuration files
- **IntelliSense**: Code completion for o9nn SDK
- **Snippets**: Quick scaffolds for common patterns

### Commands

| Command | Keybinding | Description |
|---------|------------|-------------|
| Open REPL | `Ctrl+Shift+R` | Open interactive REPL |
| Run Inference | `Ctrl+Shift+I` | Run inference on selected text |
| Start Server | - | Start development server |
| Generate Agent | - | Create new agent scaffold |
| Generate Tool | - | Create new tool scaffold |

See the [VSCode Extension README](../tools/vscode-extension/README.md) for full documentation.

---

## JetBrains IDEs

Support for JetBrains IDEs (IntelliJ IDEA, PyCharm, GoLand, WebStorm, CLion).

### Current Support

While there is no dedicated JetBrains plugin yet, you can use the following:

#### External Tools Configuration

1. Go to **Settings** → **Tools** → **External Tools**
2. Add cogctl commands:

**Start Development Server**
```
Program: cogctl
Arguments: dev
Working directory: $ProjectFileDir$
```

**Generate Agent**
```
Program: cogctl
Arguments: generate agent $Prompt$ --language $Prompt$
Working directory: $ProjectFileDir$
```

**Open REPL**
```
Program: cogctl
Arguments: repl
Working directory: $ProjectFileDir$
```

#### File Templates

Create file templates for agents and tools:

1. Go to **Settings** → **Editor** → **File and Code Templates**
2. Add new templates for Python/TypeScript/Go

**Python Agent Template**:
```python
"""
${NAME} Agent

Generated for o9nn platform.
"""

from o9nn_sdk import AgentBuilder, create_sdk


class ${NAME}Agent:
    def __init__(self, model: str = "llama-2-7b-chat"):
        self.sdk = create_sdk()
        self.model = model
    
    def setup(self):
        # TODO: Implement agent setup
        pass
    
    async def chat(self, message: str) -> str:
        # TODO: Implement chat
        pass
```

#### Live Templates

Add live templates for common patterns:

1. Go to **Settings** → **Editor** → **Live Templates**
2. Create a new group "o9nn"
3. Add templates:

| Abbreviation | Description | Template |
|--------------|-------------|----------|
| `o9agent` | Agent class | Agent class scaffold |
| `o9tool` | Tool function | Tool definition scaffold |
| `o9client` | SDK client | Client initialization |

### Planned Features

A dedicated JetBrains plugin is planned with:
- Native tool window for models/agents
- Run configurations for cogctl
- Code inspections for SDK usage
- Integrated REPL panel

---

## Neovim / Vim

Support for Neovim and Vim editors.

### Plugin Installation

Using [lazy.nvim](https://github.com/folke/lazy.nvim):

```lua
{
  "o9nn/o9nn.nvim",
  dependencies = {
    "nvim-lua/plenary.nvim",
  },
  config = function()
    require("o9nn").setup({
      cogctl_path = "cogctl",
      api_url = "http://localhost:8080",
      default_model = "llama-2-7b-chat",
    })
  end,
}
```

Using [vim-plug](https://github.com/junegunn/vim-plug):

```vim
Plug 'o9nn/o9nn.nvim'
```

### Manual Configuration

Until the official plugin is available, you can configure Neovim manually:

#### Keymaps

```lua
-- ~/.config/nvim/lua/o9nn.lua

local M = {}

M.start_server = function()
  vim.cmd("terminal cogctl dev")
end

M.open_repl = function()
  vim.cmd("vsplit | terminal cogctl repl")
end

M.generate_agent = function()
  local name = vim.fn.input("Agent name: ")
  local lang = vim.fn.input("Language (python/typescript/go): ")
  vim.cmd("terminal cogctl generate agent " .. name .. " --language " .. lang)
end

M.run_inference = function()
  local lines = vim.fn.getline("'<", "'>")
  local text = table.concat(lines, "\n")
  vim.cmd("terminal cogctl infer --prompt '" .. text:gsub("'", "\\'") .. "'")
end

return M
```

```lua
-- Keymaps
vim.keymap.set("n", "<leader>os", require("o9nn").start_server, { desc = "o9nn: Start Server" })
vim.keymap.set("n", "<leader>or", require("o9nn").open_repl, { desc = "o9nn: Open REPL" })
vim.keymap.set("n", "<leader>og", require("o9nn").generate_agent, { desc = "o9nn: Generate Agent" })
vim.keymap.set("v", "<leader>oi", require("o9nn").run_inference, { desc = "o9nn: Run Inference" })
```

#### Telescope Integration

```lua
-- Add to telescope configuration
require("telescope").setup({
  extensions = {
    o9nn = {
      -- Model picker
      models = true,
      -- Agent picker  
      agents = true,
    }
  }
})
```

#### LSP Configuration

Configure language servers for SDK completion:

```lua
-- Python (using pyright or pylsp)
require("lspconfig").pyright.setup({
  settings = {
    python = {
      analysis = {
        extraPaths = { "path/to/o9nn-sdk" },
      },
    },
  },
})

-- TypeScript (using ts_ls)
require("lspconfig").ts_ls.setup({
  settings = {
    typescript = {
      preferences = {
        importModuleSpecifier = "relative",
      },
    },
  },
})
```

### Snippets

Using [LuaSnip](https://github.com/L3MON4D3/LuaSnip):

```lua
local ls = require("luasnip")
local s = ls.snippet
local t = ls.text_node
local i = ls.insert_node

ls.add_snippets("python", {
  s("o9agent", {
    t('from o9nn_sdk import AgentBuilder, create_sdk'),
    t({"", "", ""}),
    t('class '), i(1, "MyAgent"), t(':'),
    t({"", "    def __init__(self):"}),
    t({"", "        self.sdk = create_sdk()"}),
    t({"", "    "}),
    t({"", "    def setup(self):"}),
    t({"", "        pass"}),
  }),
})
```

### Planned Features

The official `o9nn.nvim` plugin will include:
- Floating window REPL
- Model/Agent picker with telescope
- Code actions for generation
- Diagnostics for configuration files
- Tree-sitter grammar for o9nn config

---

## Emacs

Basic support for Emacs users.

### Configuration

```elisp
;; ~/.emacs.d/init.el or ~/.emacs

;; o9nn development functions
(defun o9nn-start-server ()
  "Start o9nn development server."
  (interactive)
  (async-shell-command "cogctl dev"))

(defun o9nn-open-repl ()
  "Open o9nn REPL."
  (interactive)
  (term "cogctl repl"))

(defun o9nn-generate-agent (name language)
  "Generate a new o9nn agent."
  (interactive "sAgent name: \nsLanguage (python/typescript/go): ")
  (shell-command (format "cogctl generate agent %s --language %s" name language)))

;; Keybindings (using a custom prefix)
(define-prefix-command 'o9nn-map)
(global-set-key (kbd "C-c o") 'o9nn-map)
(define-key o9nn-map (kbd "s") 'o9nn-start-server)
(define-key o9nn-map (kbd "r") 'o9nn-open-repl)
(define-key o9nn-map (kbd "g") 'o9nn-generate-agent)
```

### LSP Mode

Configure LSP for SDK support:

```elisp
(use-package lsp-mode
  :hook ((python-mode . lsp)
         (typescript-mode . lsp))
  :config
  (setq lsp-python-ms-extra-paths
        '("/path/to/o9nn-sdk/python")))
```

---

## Generic Integration

For any editor with terminal support:

### Terminal Commands

```bash
# Start development server
cogctl dev

# Open REPL
cogctl repl

# Generate agent
cogctl generate agent my-agent --language python

# Generate tool
cogctl generate tool my-tool --language typescript

# List models
cogctl model list

# Download model
cogctl model download llama-2-7b-chat

# Initialize project
cogctl init my-project --template agent
```

### Shell Integration

Add to your shell profile (`.bashrc`, `.zshrc`, etc.):

```bash
# o9nn aliases
alias o9s='cogctl dev'
alias o9r='cogctl repl'
alias o9g='cogctl generate'
alias o9m='cogctl model'

# o9nn functions
o9agent() {
  cogctl generate agent "$1" --language "${2:-python}"
}

o9tool() {
  cogctl generate tool "$1" --language "${2:-python}"
}
```

---

## Contributing

To contribute IDE integrations:

1. Fork the repository
2. Create integration in `tools/<ide-name>/`
3. Add documentation to this guide
4. Submit a pull request

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.
