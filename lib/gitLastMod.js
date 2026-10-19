const path = require('path');
const { execSync } = require('child_process');

const normalizeDateStr = (rawDate, filename = '') => {
  if (rawDate) {
    try {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
      }
    } catch (e) {}
  }
  const match = filename.match(/^(\d{4})(\d{2})(\d{2})/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }
  return '2026-01-01';
};

const getGitLastMod = (relFilePath, fallbackDate) => {
  try {
    const out = execSync(`git log -1 --format="%cs" -- "${relFilePath}"`, {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(out)) {
      return out;
    }
  } catch (e) {}
  return fallbackDate;
};

const resolveContentLastMod = (relDir, filename, frontmatter = {}) => {
  const frontmatterDate = normalizeDateStr(
    frontmatter.updated || frontmatter.lastmod || frontmatter.date,
    filename
  );
  const normalizedDir = relDir.split(path.sep).join('/').replace(/^\/+/, '');
  const relFilePath = path.posix.join(normalizedDir, filename);
  const gitDate = getGitLastMod(relFilePath, frontmatterDate);
  return gitDate > frontmatterDate ? gitDate : frontmatterDate;
};

module.exports = {
  normalizeDateStr,
  getGitLastMod,
  resolveContentLastMod,
};
