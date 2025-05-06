import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Handle GET request
    const { path } = req.query;
    try {
      const response = await fetch(`https://api.github.com/repos/${process.env.NEXT_PUBLIC_GITHUB_OWNER}/${process.env.NEXT_PUBLIC_GITHUB_REPO}/contents/${path}`, {
        headers: {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      const data = await response.json();
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'POST') {
    // Handle POST request
    const { path, content, message, upload } = req.body;
    
    try {
      let requestBody;
      if (upload) {
        // Handle file upload
        requestBody = {
          message,
          content: req.body.file,
          path: req.body.path
        };
      } else {
        // Handle JSON content directly (no base64)
        requestBody = {
          message,
          content: Buffer.from(JSON.stringify(content)).toString('base64'),
          path
        };
      }

      const response = await fetch(`https://api.github.com/repos/${process.env.NEXT_PUBLIC_GITHUB_OWNER}/${process.env.NEXT_PUBLIC_GITHUB_REPO}/contents/${path}`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}
