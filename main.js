const core = require("@actions/core");
const github = require("@actions/github");
const AdmZip = require("adm-zip");
const filesize = require("filesize");
const path = require("path");
const fs = require("fs");

async function main() {
  const token = core.getInput("github_token");
  const pr = core.getInput("pr");
  const artifactName = core.getInput("artifact_name", { required: true });
  const workflowFilename = core.getInput("workflow_file_name", {
    required: true,
  });
  const [owner, repo] = core.getInput("repo").split("/");
  const destPath = core.getInput("path");

  console.log("==> PR", pr);
  console.log("==> Workflow Filename", workflowFilename);
  console.log("==> Owner", owner);
  console.log("==> Repo", repo);

  const client = github.getOctokit(token);

  const pull = await client.rest.pulls.get({
    owner,
    repo,
    pull_number: pr,
  });

  if (!pull) {
    throw new Error("No PR found");
  }

  console.log("==> Branch", pull.data.head.ref);

  let artifacts = [];

  for await (const runs of client.paginate.iterator(
    client.rest.actions.listWorkflowRuns,
    {
      owner,
      repo,
      workflow_id: workflowFilename,
      event: "pull_request",
      status: "success",
      branch: pull.data.head.ref,
    }
  )) {
    for (const run of runs.data) {
      let af = await client.paginate(
        client.rest.actions.listWorkflowRunArtifacts,
        {
          owner: owner,
          repo: repo,
          run_id: run.id,
        }
      );

      artifacts.push(...af.filter((a) => a.name === artifactName));
    }
  }

  artifacts = artifacts.filter(Boolean);

  if (artifacts.length === 0) {
    throw new Error("No artifacts found");
  }

  console.log("==> Artifacts found", artifacts.map((a) => a.id).join(", "));

  // sort by date DESC
  artifacts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // get latest created artifact
  const artifact = artifacts[0];

  console.log("==> Chosen Artifact", artifact.id);
  const size = filesize(artifact.size_in_bytes, { base: 10 });

  console.log(`==> Downloading: ${artifact.name}.zip (${size})`);
  const zip = await client.rest.actions.downloadArtifact({
    owner: owner,
    repo: repo,
    artifact_id: artifact.id,
    archive_format: "zip",
  });

  const dir = path.join(destPath);
  fs.mkdirSync(dir, { recursive: true });

  const adm = new AdmZip(Buffer.from(zip.data));

  adm.getEntries().forEach((entry) => {
    const action = entry.isDirectory ? "creating" : "inflating";
    const filepath = path.join(dir, entry.entryName);

    console.log(`  ${action}: ${filepath}`);
  });

  adm.extractAllTo(dir, true);
}

main().catch((err) => {
  core.setFailed(err.stack);
});
