import React from 'react';

/**
 * Renders inline markdown patterns (e.g., **bold**, *italic*) into clean React nodes.
 *
 * @param {string} text - Raw string containing inline markdown symbols.
 * @returns {React.ReactNode} Parsed React elements.
 */
export function renderMarkdown(text) {
    if (!text) return '';

    // Split text into lines to preserve structure
    const lines = text.split('\n');

    return lines.map((line, lineIdx) => {
        const parts = [];
        const regex = /(\*\*.*?\*\*|\*.*?\*)/g;
        let lastIndex = 0;
        let match;

        // Reset regex cursor
        regex.lastIndex = 0;

        while ((match = regex.exec(line)) !== null) {
            const matchIndex = match.index;
            const matchText = match[0];

            // Append leading plain text
            if (matchIndex > lastIndex) {
                parts.push(line.substring(lastIndex, matchIndex));
            }

            // Bold styling: **text**
            if (matchText.startsWith('**') && matchText.endsWith('**')) {
                parts.push(
                    <strong key={matchIndex} className="font-bold">
                        {matchText.slice(2, -2)}
                    </strong>
                );
            }
            // Italic styling: *text*
            else if (matchText.startsWith('*') && matchText.endsWith('*')) {
                parts.push(
                    <em key={matchIndex} className="italic">
                        {matchText.slice(1, -1)}
                    </em>
                );
            }

            lastIndex = regex.lastIndex;
        }

        // Append trailing plain text
        if (lastIndex < line.length) {
            parts.push(line.substring(lastIndex));
        }

        return (
            <React.Fragment key={lineIdx}>
                {parts.length > 0 ? parts : ' '}
                {lineIdx < lines.length - 1 && <br />}
            </React.Fragment>
        );
    });
}
