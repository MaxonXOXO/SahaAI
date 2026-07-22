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
        let parsedLine = line;

        // 1. Handle Headers (###, ##, #)
        let isHeader = false;
        let headerLevel = 0;
        const headerMatch = parsedLine.match(/^(#{1,3})\s+(.*)/);
        if (headerMatch) {
            isHeader = true;
            headerLevel = headerMatch[1].length;
            parsedLine = headerMatch[2];
        }

        // 2. Handle stray single asterisks at the end of words (like "Smile* " or "Tip:* ")
        // Sometimes LLMs generate weird single asterisks for lists
        parsedLine = parsedLine.replace(/([a-zA-Z0-9])\*\s/g, '$1 ');
        parsedLine = parsedLine.replace(/([a-zA-Z0-9]):\*\s/g, '$1: ');

        const parts = [];

        // 3. Handle inline Bold/Italic
        const regex = /(\*\*.*?\*\*|\*.*?\*)/g;
        let lastIndex = 0;
        let match;
        regex.lastIndex = 0;

        while ((match = regex.exec(parsedLine)) !== null) {
            const matchIndex = match.index;
            const matchText = match[0];

            if (matchIndex > lastIndex) {
                parts.push(parsedLine.substring(lastIndex, matchIndex));
            }

            if (matchText.startsWith('**') && matchText.endsWith('**')) {
                parts.push(<strong key={matchIndex} className="font-bold">{matchText.slice(2, -2)}</strong>);
            } else if (matchText.startsWith('*') && matchText.endsWith('*')) {
                parts.push(<em key={matchIndex} className="italic">{matchText.slice(1, -1)}</em>);
            }

            lastIndex = regex.lastIndex;
        }

        if (lastIndex < parsedLine.length) {
            parts.push(parsedLine.substring(lastIndex));
        }

        // Render line with appropriate styling
        let content = parts.length > 0 ? parts : ' ';
        
        if (isHeader) {
            const headerClasses = {
                1: "text-lg font-bold text-gray-900 dark:text-white mt-4 mb-2",
                2: "text-base-lg font-bold text-gray-800 dark:text-gray-100 mt-3 mb-1",
                3: "text-base-md font-bold text-gray-800 dark:text-gray-100 mt-2 mb-1"
            };
            content = <div className={headerClasses[headerLevel]}>{content}</div>;
        }

        return (
            <React.Fragment key={lineIdx}>
                {content}
                {!isHeader && lineIdx < lines.length - 1 && <br />}
            </React.Fragment>
        );
    });
}
