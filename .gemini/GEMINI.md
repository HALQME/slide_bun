# Project Workflow

This project uses `jj` for version control.

For each meaningful unit of editing, please follow these steps:
1. Run `bun run test|check|lint:fix|format` to perform quality checks and error corrections.
2. If the checks pass, execute `jj commit -m "作業内容"`.
