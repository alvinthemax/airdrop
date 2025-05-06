import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

export default async function handler(req, res) {
  const path = req.query.path || req.body.path;
  const owner = process.env.NEXT_PUBLIC_GITHUB_OWNER;
  const repo = process.env.NEXT_PUBLIC_GITHUB_REPO;
  const branch = process.env.NEXT_PUBLIC_GITHUB_BRANCH || 'main';

  if (!path) {
    return res.status(400).json({ error: 'Path is required' });
  }

  if (req.method === 'GET') {
    try {
      const response = await octokit.repos.getContent({
        owner,
        repo,
        path,
        ref: branch
      });

      let content = response.data.content;

      if (response.data.encoding === 'base64') {
        content = Buffer.from(content, 'base64').toString('utf8');
        try {
          content = JSON.parse(content);
        } catch (e) {
          // return as string if not JSON
        }
      }

      res.status(200).json({ content });
    } catch (error) {
      console.error('GET error:', error);
      res.status(500).json({ error: 'Failed to fetch file from GitHub', details: error.response?.data });
    }
  } else if (req.method === 'POST') {
    const { content, message, upload, append } = req.body;

    try {
      // Get SHA of existing file (if any)
      let sha = null;
      try {
        const fileResponse = await octokit.repos.getContent({
          owner,
          repo,
          path,
          ref: branch
        });
        sha = fileResponse.data.sha;
      } catch (error) {
        // File doesn't exist yet, sha remains null
      }

      // Prepare content - no need to base64 encode since we're sending as string
      let newContent;
      if (append) {
        try {
          const existing = await octokit.repos.getContent({
            owner,
            repo,
            path,
            ref: branch
          });
          const existingContent = Buffer.from(existing.data.content, 'base64').toString('utf8');
          const parsedExisting = JSON.parse(existingContent);
          const toAppend = typeof content === 'string' ? JSON.parse(content) : content;
          const merged = [...parsedExisting, toAppend];
          newContent = JSON.stringify(merged, null, 2);
        } catch (e) {
          newContent = JSON.stringify([content], null, 2);
        }
      } else {
        newContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
      }

      const response = await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message,
        content: Buffer.from(newContent).toString('base64'), // GitHub still requires base64
        sha,
        branch,
        // Add this to ensure proper encoding
        headers: {
          'accept': 'application/vnd.github.v3+json',
          'content-type': 'application/json; charset=utf-8'
        }
      });

      res.status(200).json(response.data);
    } catch (error) {
      console.error('POST error:', error);
      res.status(500).json({ error: 'Failed to update file on GitHub', details: error.response?.data });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
