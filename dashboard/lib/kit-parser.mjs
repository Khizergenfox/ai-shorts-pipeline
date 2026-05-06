/**
 * Parses a publishing-kit Markdown file into structured per-platform captions.
 *
 * Expected MD structure:
 *   ## YouTube Shorts
 *   ### Title (...)
 *   ```
 *   ...
 *   ```
 *   ### Description
 *   ```
 *   ...
 *   ```
 *   ### Tags
 *   `tag1, tag2, tag3`
 *   ### Pinned comment ...
 *   ```...```
 *
 *   ## Instagram Reels
 *   ### Caption
 *   ```...```
 *   ### First-comment ...
 *   ```...```
 *
 *   ## LinkedIn
 *   ### Caption
 *   ```...```
 */

const fenced = (label) =>
  new RegExp(`### ${label}[^\\n]*\\n\`\`\`\\n([\\s\\S]*?)\\n\`\`\``);

function fencedMatch(section, label) {
  const m = section.match(fenced(label));
  return m ? m[1].trim() : '';
}

function inlineCode(section, label) {
  const m = section.match(new RegExp(`### ${label}\\n\`([^\`]+)\``));
  return m ? m[1].trim() : '';
}

export function parseKit(md) {
  const result = {
    raw: md,
    youtube: { title: '', description: '', tags: '', pinnedComment: '' },
    instagram: { caption: '', firstComment: '' },
    linkedin: { caption: '' },
    x: { tweet: '', threadFollowups: [] },
  };

  const sections = md.split(/^## /m);
  for (const sec of sections) {
    const head = sec.split('\n', 1)[0].trim();

    if (head.startsWith('YouTube Shorts')) {
      result.youtube.title = fencedMatch(sec, 'Title');
      result.youtube.description = fencedMatch(sec, 'Description');
      result.youtube.tags = inlineCode(sec, 'Tags');
      result.youtube.pinnedComment = fencedMatch(sec, 'Pinned comment');
    } else if (head.startsWith('Instagram')) {
      result.instagram.caption = fencedMatch(sec, 'Caption');
      result.instagram.firstComment = fencedMatch(sec, 'First-comment');
    } else if (head.startsWith('LinkedIn')) {
      result.linkedin.caption = fencedMatch(sec, 'Caption');
    } else if (head.startsWith('X (Twitter)') || head.startsWith('X ')) {
      result.x.tweet = fencedMatch(sec, 'Tweet');
      // Optional thread followup tweets — each in its own ``` block under "### Thread followups"
      const followupSection = sec.split('### Thread followups')[1];
      if (followupSection) {
        const matches = [...followupSection.matchAll(/```\n([\s\S]*?)\n```/g)];
        result.x.threadFollowups = matches.map((m) => m[1].trim());
      }
    }
  }

  return result;
}
