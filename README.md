# Download review artifact

A Github action that lets you download pull request review artifacts.

## Example usage

```yml
uses: animately/action-download-pr-artifact@main
with:
  workflow_file_name: ci.yml
  github_token: ${{ github.token }}
  repo: ${{ github.repository }}
  pr: ${{ github.event.pull_request.number }}
```
