\---

name: vercel-web-deployment

description: Prepare, verify, and maintain a frontend website for GitHub-connected deployment on Vercel. Use when creating a deployment-ready site, checking a production build, fixing a Vercel build, or validating the GitHub-to-Vercel update loop.

\---



\# Vercel Web Deployment



Use this skill for deployment readiness and release verification.



1\. Inspect the project before editing. Identify the framework, package manager, local run command, production build command, output structure, and whether environment variables are required.

2\. Keep the architecture simple. Prefer a frontend-focused site and GitHub-connected Vercel deployment. Do not add a backend or database unless the site genuinely requires one.

3\. Verify the project locally before deployment. For Node.js projects, install dependencies when needed and run the relevant local and production build checks.

4\. Before any Git push, check .gitignore and ensure that passwords, tokens, API keys, .env files, credentials, private certificates, and machine-specific files are not committed.

5\. Run the production build when the project provides one. If it fails, identify the first meaningful error and make the smallest justified fix.

6\. Do not claim success only because files were edited. State what was tested and what still requires human verification.

7\. The student executes Git commit and push commands in the terminal. Explain the commands clearly; do not hide the Git workflow.

8\. Treat main as the production branch unless the repository is configured differently.

9\. After a push, instruct the student to check the Vercel deployment status and open the production URL to verify the visible change.

10\. Custom domain configuration is optional. When used, add the domain in Vercel and enter the exact DNS records shown by Vercel at the registrar. Never guess DNS values.

11\. Never place passwords, GitHub tokens, Vercel tokens, API keys, or secrets in source code, SKILL.md, README.md, or public command examples.

12\. Preserve the existing visual language when making incremental updates unless the user explicitly requests a redesign.

13\. Prefer small, reviewable changes. After each meaningful change, summarize modified files and the verification performed.

