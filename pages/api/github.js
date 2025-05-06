import { Octokit } from 'octokit';

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
  }

  else if (req.method === 'POST') {
    const { content, message, upload, append } = req.body;

    try {
      // Ambil SHA dari file
      const fileResponse = await octokit.repos.getContent({
        owner,
        repo,
        path,
        ref: branch
      });

      const fileData = fileResponse.data;
      const sha = fileData.sha;

      let newContent;
      if (append) {
        const existing = JSON.parse(Buffer.from(fileData.content, 'base64').toString('utf8'));
        const toAppend = typeof content === 'string' ? JSON.parse(content) : content;
        const merged = [...existing, toAppend];
        newContent = Buffer.from(JSON.stringify(merged, null, 2)).toString('base64');
      } else {
        newContent = Buffer.from(
          typeof content === 'string' ? content : JSON.stringify(content, null, 2)
        ).toString('base64');
      }

      const response = await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message,
        content: newContent,
        sha,
        branch
      });

      res.status(200).json(response.data);
    } catch (error) {
      console.error('POST error:', error);
      res.status(500).json({ error: 'Failed to update file on GitHub', details: error.response?.data });
    }
  }

  else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
