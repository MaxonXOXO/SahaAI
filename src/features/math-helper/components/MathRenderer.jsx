import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

export default function MathRenderer({ text = '', className = '' }) {
    if (!text) return null;

    // Detect if the text contains LaTeX characters but no delimiters, and wrap it
    let processedText = text;
    const hasDelimiters = /(\$\$|\\\[|\$|\\\()/.test(text);
    if (!hasDelimiters && /\\|[\^_{}]/.test(text)) {
        processedText = `$$${text}$$`;
    }

    // Split text into segments of math and non-math
    const regex = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\$[\s\S]+?\$|\\\([\s\S]+?\\\))/g;
    const parts = processedText.split(regex);

    return (
        <span className={className}>
            {parts.map((part, index) => {
                let isMath = false;
                let mathText = part;
                let displayMode = false;

                if (part.startsWith('$$') && part.endsWith('$$')) {
                    isMath = true;
                    mathText = part.slice(2, -2);
                    displayMode = true;
                } else if (part.startsWith('\\\[') && part.endsWith('\\\]')) {
                    isMath = true;
                    mathText = part.slice(2, -2);
                    displayMode = true;
                } else if (part.startsWith('$') && part.endsWith('$')) {
                    isMath = true;
                    mathText = part.slice(1, -1);
                    displayMode = false;
                } else if (part.startsWith('\\\(') && part.endsWith('\\\)')) {
                    isMath = true;
                    mathText = part.slice(2, -2);
                    displayMode = false;
                }

                if (isMath) {
                    try {
                        const html = katex.renderToString(mathText, {
                            displayMode,
                            throwOnError: false,
                            trust: true
                        });
                        return (
                            <span
                                key={index}
                                dangerouslySetInnerHTML={{ __html: html }}
                                className={displayMode ? "block my-2 overflow-x-auto w-full text-center" : "inline-block align-middle mx-0.5"}
                            />
                        );
                    } catch (err) {
                        console.error('KaTeX rendering error:', err);
                        return <code key={index} className="px-1 py-0.5 bg-gray-150 dark:bg-gray-800 rounded font-mono text-[11px]">{part}</code>;
                    }
                }

                return <span key={index}>{part}</span>;
            })}
        </span>
    );
}
