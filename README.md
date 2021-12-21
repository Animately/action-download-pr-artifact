# Download pull request artifact

The regular [`actions/download-artifact@v2`](https://github.com/actions/download-artifact) Github action only lets you download an artifact within the same workflow. 
With this Github Action you can share artifacts across a PR.

## Example usage

```yml
uses: animately/action-download-pr-artifact@main
with:
  # (required) the workflow file to search jobs
  workflow_file_name: ci.yml

  # (required) the artifact name to search for
  artifact_name: my-artifact
  
  # (optional) the output path to save the artifact to
  # default ./
  path: /tmp/my-artifact
  
  # (optional) the Github access token
  # default ${{ github.token }}
  github_token: ${{ github.token }}
  
  # (optional) the repository
  repo: ${{ github.repository }}
  
  # (optional) the pull request number
  # default ${{ github.event.pull_request.number }} 
  pr: ${{ github.event.pull_request.number }}
```
