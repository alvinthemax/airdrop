import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

export default async function handler(req, res) {
  const { path } = req.query || req.body;

  if (req.method === 'POST') {
    const { content, message, upload } = req.body;

    try {
      // Get current file SHA
      const fileResponse = await fetch(`https://api.github.com/repos/${process.env.NEXT_PUBLIC_GITHUB_OWNER}/${process.env.NEXT_PUBLIC_GITHUB_REPO}/contents/${path}`, {
        headers: {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      const fileData = await fileResponse.json();
      const sha = fileData.sha;

      // Prepare content for upload
      let encodedContent;
      if (upload) {
        encodedContent = req.body.file; // For image uploads
      } else {
        // For JSON content, handle UTF-8 properly
        if (typeof content === 'string') {
          encodedContent = Buffer.from(content).toString('base64');
        } else {
          // Stringify with proper formatting and UTF-8 support
          encodedContent = Buffer.from(JSON.stringify(content, null, 2)).toString('base64');
        }
      }

      // Prepare request body
      const requestBody = {
        owner: process.env.NEXT_PUBLIC_GITHUB_OWNER,
        repo: process.env.NEXT_PUBLIC_GITHUB_REPO,
        path,
        message,
        content: encodedContent,
        sha,
        branch: process.env.NEXT_PUBLIC_GITHUB_BRANCH || 'main'
      };

      // Make the update request using Octokit for better error handling
      const response = await octokit.repos.createOrUpdateFileContents(requestBody);

      res.status(200).json(response.data);

    } catch (error) {
      console.error('GitHub API Error:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to update file',
        details: error.response?.data 
      });
    }
  } else if (req.method === 'GET') {
    try {
      const response = await octokit.repos.getContent({
        owner: process.env.NEXT_PUBLIC_GITHUB_OWNER,
        repo: process.env.NEXT_PUBLIC_GITHUB_REPO,
        path,
        ref: process.env.NEXT_PUBLIC_GITHUB_BRANCH || 'main'
      });

      // Handle content decoding properly
      let content;
      if (response.data.content) {
        if (response.data.encoding === 'base64') {
          content = Buffer.from(response.data.content, 'base64').toString('utf8');
          try {
            // Try to parse JSON if it looks like JSON
            content = JSON.parse(content);
          } catch (e) {
            // If not JSON, keep as is
          }
        } else {
          content = response.data.content;
        }
      }

      res.status(200).json({
        ...response.data,
        content
      });
    } catch (error) {
      console.error('GitHub API Error:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to fetch file',
        details: error.response?.data 
      });
    }
  }
}
